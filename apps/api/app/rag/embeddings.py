from __future__ import annotations

import hashlib
import logging
import math
from functools import lru_cache

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingProvider:
    def __init__(self, model_name: str, dimension: int = 384) -> None:
        self.model_name = model_name
        self.dimension = dimension
        self._model = None
        self._fallback_logged = False

        try:
            from sentence_transformers import SentenceTransformer  # type: ignore

            self._model = SentenceTransformer(model_name)
            sample = self._model.encode(["dimension check"])
            if hasattr(sample, "shape") and len(sample.shape) > 1:
                self.dimension = int(sample.shape[1])
        except Exception as exc:  # pragma: no cover - depends on local env
            self._model = None
            logger.warning("Falling back to deterministic mock embeddings for %s: %s", model_name, exc)

    def _fallback_embedding(self, text: str) -> list[float]:
        if not self._fallback_logged:
            logger.warning("Using deterministic fallback embeddings with dimension %s", self.dimension)
            self._fallback_logged = True

        values: list[float] = []
        seed = text.encode("utf-8")
        block = 0
        while len(values) < self.dimension:
            digest = hashlib.sha256(seed + block.to_bytes(2, "big")).digest()
            values.extend(((byte / 255.0) * 2.0) - 1.0 for byte in digest)
            block += 1

        vector = values[: self.dimension]
        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]

    def embed_text(self, text: str) -> list[float]:
        return self.embed_batch([text])[0]

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        if self._model is None:
            return [self._fallback_embedding(text) for text in texts]

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

