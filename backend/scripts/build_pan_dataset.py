from backend.api.dependencies import get_preprocessor, get_store
from backend.services.dataset_loader import PanDatasetLoader
from backend.utils.config import get_settings


def main() -> None:
    settings = get_settings()
    loader = PanDatasetLoader(
        dataset_root=settings.pan_dataset_root,
        store=get_store(),
        preprocessor=get_preprocessor(),
        processed_json_path=settings.processed_dataset_json,
    )
    payload = loader.build()
    print(f"Indexed {payload['document_count']} PAN documents")
    print(f"Processed dataset manifest: {settings.processed_dataset_json}")


if __name__ == "__main__":
    main()
