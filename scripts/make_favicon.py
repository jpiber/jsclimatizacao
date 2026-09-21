"""Gera os favicons "JS" da JS Climatização a partir da identidade da marca.

Uso: python /app/scripts/make_favicon.py
Saída: frontend/public/favicon-16x16.png, favicon-32x32.png,
       apple-touch-icon.png, favicon.ico
O favicon.svg é escrito à mão (vetor) e não é gerado aqui.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path("/app/frontend/public")
SUPERSAMPLE = 8

NAVY = (11, 19, 43, 255)        # #0B132B — moldura
CYAN_TOP = (56, 189, 248)       # #38BDF8
CYAN_MID = (0, 180, 216)        # #00B4D8
CYAN_BOTTOM = (2, 132, 199)     # #0284C7
INK = (4, 21, 37, 255)          # #041525 — letras

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    raise SystemExit("Nenhuma fonte TrueType encontrada")


def gradient(size: int) -> Image.Image:
    """Degradê diagonal ciano (topo-esquerda -> base-direita)."""
    grad = Image.new("RGB", (size, size))
    px = grad.load()
    for y in range(size):
        for x in range(size):
            t = (x / (size - 1) + y / (size - 1)) / 2
            if t < 0.55:
                k = t / 0.55
                a, b = CYAN_TOP, CYAN_MID
            else:
                k = (t - 0.55) / 0.45
                a, b = CYAN_MID, CYAN_BOTTOM
            px[x, y] = (
                round(a[0] + (b[0] - a[0]) * k),
                round(a[1] + (b[1] - a[1]) * k),
                round(a[2] + (b[2] - a[2]) * k),
            )
    return grad


def render(target: int, *, border: bool = True) -> Image.Image:
    size = target * SUPERSAMPLE
    radius = round(size * 0.22)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Moldura navy (some nos tamanhos minúsculos, onde cada pixel conta)
    if border:
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=NAVY)
        inset = round(size * 0.047)
    else:
        inset = 0

    # Placa ciano com degradê, recortada pelo retângulo arredondado
    plate_box = [inset, inset, size - 1 - inset, size - 1 - inset]
    plate_w = plate_box[2] - plate_box[0] + 1
    mask = Image.new("L", (plate_w, plate_w), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, plate_w - 1, plate_w - 1], radius=round(radius * 0.86), fill=255
    )
    img.paste(gradient(plate_w), (plate_box[0], plate_box[1]), mask)

    # Monograma "JS" centralizado óptica e verticalmente
    text = "JS"
    font_size = round(size * 0.52)
    font = load_font(font_size)
    while font_size > 8:
        bbox = draw.textbbox((0, 0), text, font=font)
        if bbox[2] - bbox[0] <= plate_w * 0.78:
            break
        font_size -= max(1, round(font_size * 0.04))
        font = load_font(font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    x = (size - (bbox[2] - bbox[0])) / 2 - bbox[0]
    y = (size - (bbox[3] - bbox[1])) / 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=INK)

    return img.resize((target, target), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    render(32).save(OUT / "favicon-32x32.png", optimize=True)
    # 16px: sem moldura, senão a borda come a legibilidade das letras
    render(16, border=False).save(OUT / "favicon-16x16.png", optimize=True)
    render(180).save(OUT / "apple-touch-icon.png", optimize=True)

    ico = render(256)
    ico.save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    for name in ("favicon-16x16.png", "favicon-32x32.png", "apple-touch-icon.png", "favicon.ico"):
        path = OUT / name
        print(f"{name}: {path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
