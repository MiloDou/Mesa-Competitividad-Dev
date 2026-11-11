from django.db import migrations


INITIAL_INSTITUTIONS = [
    # 01 Academia
    {
        "id": "cunoc",
        "name": "CUNOC / USAC",
        "category": "Academia",
        "initials": "CUNOC",
        "photo": "https://hbllnxysfwmjofuyyfom.supabase.co/storage/v1/object/public/entidades/Usac.jpg",
        "status": "activo",
    },
    {
        "id": "url",
        "name": "Univ. Rafael Landívar",
        "category": "Academia",
        "initials": "URL",
        "photo": "https://hbllnxysfwmjofuyyfom.supabase.co/storage/v1/object/public/entidades/land.png",
        "status": "activo",
    },
    {
        "id": "meso",
        "name": "Univ. Mesoamericana",
        "category": "Academia",
        "initials": "MESO",
        "photo": "https://hbllnxysfwmjofuyyfom.supabase.co/storage/v1/object/public/entidades/meso.png",
        "status": "activo",
    },
    {
        "id": "udv",
        "name": "Univ. Da Vinci",
        "category": "Academia",
        "initials": "UDV",
        "photo": "https://hbllnxysfwmjofuyyfom.supabase.co/storage/v1/object/public/entidades/da%20vinci.png",
        "status": "activo",
    },
    {
        "id": "umg",
        "name": "Universidad Mariano Gálvez de Guatemala",
        "category": "Academia",
        "initials": "UMG",
        "photo": "/entidades/umg.png",
        "status": "activo",
    },

    # 02 Sector Público
    {
        "id": "gobernacion",
        "name": "Gobernación Departamental",
        "category": "Sector Público",
        "initials": "GOB",
        "photo": "https://hbllnxysfwmjofuyyfom.supabase.co/storage/v1/object/public/entidades/gob.png",
        "status": "activo",
    },
    {
        "id": "mineco",
        "name": "MINECO",
        "category": "Sector Público",
        "initials": "MINECO",
        "photo": "https://hbllnxysfwmjofuyyfom.supabase.co/storage/v1/object/public/entidades/mineco.png",
        "status": "activo",
    },
    {
        "id": "inguat",
        "name": "INGUAT",
        "category": "Sector Público",
        "initials": "INGUAT",
        "photo": "https://hbllnxysfwmjofuyyfom.supabase.co/storage/v1/object/public/entidades/inguat.png",
        "status": "activo",
    },
    {
        "id": "metropoli",
        "name": "Mancomunidad Metrópoli de los Altos",
        "category": "Sector Público",
        "initials": "MMA",
        "photo": "https://hbllnxysfwmjofuyyfom.supabase.co/storage/v1/object/public/entidades/metro.webp",
        "status": "activo",
    },
    {
        "id": "amdel",
        "name": "AMDEL",
        "category": "Sector Público",
        "initials": "AMDEL",
        "photo": "https://hbllnxysfwmjofuyyfom.supabase.co/storage/v1/object/public/entidades/Gemini_Generated_Image_rs4by4rs4by4rs4b.jpg",
        "status": "activo",
    },
    {
        "id": "svet",
        "name": "SVET",
        "category": "Sector Público",
        "initials": "SVET",
        "photo": "/entidades/svet.png",
        "status": "activo",
    },
    {
        "id": "intecap",
        "name": "INTECAP",
        "category": "Sector Público",
        "initials": "INTECAP",
        "photo": "/entidades/intecap.png",
        "status": "activo",
    },

    # 03 Sector Social
    {
        "id": "grupogestor",
        "name": "Red Nacional de Grupos Gestores",
        "category": "Sector Social",
        "initials": "RNGG",
        "photo": "https://hbllnxysfwmjofuyyfom.supabase.co/storage/v1/object/public/entidades/images.jpeg",
        "status": "activo",
    },
    {
        "id": "accss",
        "name": "ACCSS",
        "category": "Sector Social",
        "initials": "ACCSS",
        "photo": "/entidades/accss.svg",
        "status": "activo",
    },
    {
        "id": "trocaire",
        "name": "Trócaire",
        "category": "Sector Social",
        "initials": "TRC",
        "photo": "/entidades/trocaire.png",
        "status": "activo",
    },
    {
        "id": "world_vision",
        "name": "World Vision Guatemala",
        "category": "Sector Social",
        "initials": "WV",
        "photo": "/entidades/world-vision.png",
        "status": "activo",
    },
    {
        "id": "mesa_competitividad",
        "name": "Mesa Departamental de Competitividad de Quetzaltenango",
        "category": "Sector Social",
        "initials": "MDCQ",
        "photo": "/entidades/mesa-logo.png",
        "status": "activo",
    },
    {
        "id": "entre_mujeres_gt",
        "name": "Entre Mujeres Gt",
        "category": "Sector Social",
        "initials": "EMG",
        "photo": "",
        "status": "activo",
    },

    # 04 Sector Productivo
    {
        "id": "ent_1791954416295",
        "name": "Cámara de Comercio de Guatemala",
        "category": "Sector Productivo",
        "initials": "CCG",
        "photo": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCidB5DqDKRJIS5th-CX0KTnEl0CyruPp2QC2pVqOLwgEBuvibBdtzwFjl&s=10",
        "status": "activo",
    },
    {
        "id": "agies",
        "name": "AGIES",
        "category": "Sector Productivo",
        "initials": "AGIES",
        "photo": "/entidades/agies.jpg",
        "status": "activo",
    },
    {
        "id": "tecno_volckanica",
        "name": "Tecno Volckanica S.A.",
        "category": "Sector Productivo",
        "initials": "TV",
        "photo": "/entidades/tecno-volckanica.png",
        "status": "activo",
    },
    {
        "id": "profesional_liberal",
        "name": "Profesional Liberal",
        "category": "Sector Productivo",
        "initials": "PL",
        "photo": "",
        "status": "activo",
    },
    {
        "id": "arquineologia",
        "name": "Arquineologia",
        "category": "Sector Productivo",
        "initials": "ARQ",
        "photo": "",
        "status": "activo",
    },
    {
        "id": "interespacios_estudio",
        "name": "Interespacios Estudio",
        "category": "Sector Productivo",
        "initials": "IE",
        "photo": "",
        "status": "activo",
    },
    {
        "id": "altaluna",
        "name": "Altaluna, S. A.",
        "category": "Sector Productivo",
        "initials": "AL",
        "photo": "",
        "status": "activo",
    },
]


def seed_institutions(apps, schema_editor):
    Institution = apps.get_model("directory", "Institution")
    LandingContent = apps.get_model("portal", "LandingContent")
    database = schema_editor.connection.alias

    for item in INITIAL_INSTITUTIONS:
        key = item["id"]
        name = item["name"]
        category = item["category"]

        inst = (
            Institution.objects.using(database).filter(landing_key=key).first()
            or Institution.objects.using(database).filter(name__iexact=name).first()
        )

        if inst is None:
            inst = Institution(landing_key=key, name=name)

        inst.landing_key = key
        inst.name = name
        inst.sector = category
        inst.is_active = True

        existing_data = inst.presentation_data if isinstance(inst.presentation_data, dict) else {}
        merged_data = {**existing_data, **item}
        # If existing has photo, preserve it unless empty
        if not merged_data.get("photo") and item.get("photo"):
            merged_data["photo"] = item["photo"]

        inst.presentation_data = merged_data
        inst.save(using=database)

    # También actualizar LandingContent si existe
    landing = LandingContent.objects.using(database).filter(key="main").first()
    if landing and isinstance(landing.content, dict):
        content = dict(landing.content)
        current_entities = content.get("entities", [])
        if not isinstance(current_entities, list):
            current_entities = []

        seen_names = {str(e.get("name", "")).lower().strip() for e in current_entities if isinstance(e, dict)}
        for item in INITIAL_INSTITUTIONS:
            if item["name"].lower().strip() not in seen_names:
                current_entities.append(item)
                seen_names.add(item["name"].lower().strip())

        content["entities"] = current_entities
        landing.content = content
        landing.save(using=database)


class Migration(migrations.Migration):
    dependencies = [
        ("directory", "0002_institution_landing_content"),
        ("portal", "0004_landingcontent"),
    ]

    operations = [
        migrations.RunPython(seed_institutions, migrations.RunPython.noop),
    ]

