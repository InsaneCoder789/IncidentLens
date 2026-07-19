from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings

class EmbeddingProvider:
    def __init__(self, model_name: str, dimension: int = 384) -> None:
        self.model_name = model_name
        self.dimension = dimension
        self._model = None
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore

            self._model = SentenceTransformer(model_name)
            sample = self._model.encode(["dimension check"])
            if hasattr(sample, "shape") and len(sample.shape) > 1:
                self.dimension = int(sample.shape[1])
        except Exception as exc:  # pragma: no cover - depends on local model installation
            raise RuntimeError(f"Embedding model {model_name!r} could not be loaded") from exc

    def embed_text(self, text: str) -> list[float]:
        return self.embed_batch([text])[0]

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        encoded = self._model.encode(texts, normalize_embeddings=True)
        if hasattr(encoded, "tolist"):
            return [list(map(float, row)) for row in encoded.tolist()]
        return [list(map(float, row)) for row in encoded]


@lru_cache
def get_embedding_provider() -> EmbeddingProvider:
    settings = get_settings()
    return EmbeddingProvider(
        model_name=settings.embedding_model_name,
        dimension=settings.embedding_dimension,
    )
