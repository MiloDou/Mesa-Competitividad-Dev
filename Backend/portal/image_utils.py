import warnings
from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError


MAX_IMAGE_PIXELS = 40_000_000
MAX_IMAGE_DIMENSION = 1920


class InvalidImage(ValueError):
    pass


def optimize_uploaded_image(upload):
    """Validate, orient, resize, and compress a PNG/JPEG CMS upload."""
    try:
        upload.seek(0)
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(upload) as source:
                image_format = source.format
                if image_format not in {"PNG", "JPEG"}:
                    raise InvalidImage("Solo se admiten imágenes PNG y JPEG válidas.")
                if source.width * source.height > MAX_IMAGE_PIXELS:
                    raise InvalidImage("La imagen excede el límite seguro de resolución.")
                source.verify()

            upload.seek(0)
            with Image.open(upload) as source:
                image = ImageOps.exif_transpose(source)
                image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)
                if image_format == "JPEG":
                    if image.mode != "RGB":
                        if image.mode in {"RGBA", "LA"}:
                            rgba = image.convert("RGBA")
                            background = Image.new("RGB", rgba.size, "white")
                            background.paste(rgba, mask=rgba.getchannel("A"))
                            image = background
                        else:
                            image = image.convert("RGB")
                    save_options = {"quality": 82, "optimize": True, "progressive": True}
                else:
                    if image.mode not in {"1", "L", "LA", "P", "RGB", "RGBA"}:
                        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
                    save_options = {"optimize": True, "compress_level": 9}

                optimized = BytesIO()
                image.save(optimized, format=image_format, **save_options)
    except InvalidImage:
        raise
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise InvalidImage("El archivo no contiene una imagen PNG o JPEG válida y segura.") from exc

    return ContentFile(optimized.getvalue(), name=upload.name)
