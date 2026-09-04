"""
RFC 6962-Compliant Merkle Tree & Cryptographic Audit Proof Generator.
Implements:
- Leaf Hash: SHA-256(0x00 || leaf_data)
- Node Hash: SHA-256(0x01 || left_hash || right_hash)
- Power-of-2 split rule: k = 2^(floor(log2(n - 1)))
- Inclusion proof generation (audit path)
- Independent cryptographic verification
"""
import hashlib
import json
from typing import List, Dict, Any, Optional, Tuple


def rfc6962_leaf_hash(data: bytes) -> bytes:
    """Computes SHA-256(0x00 || data) as defined in RFC 6962 Section 2.1."""
    h = hashlib.sha256()
    h.update(b"\x00")
    h.update(data)
    return h.digest()


def rfc6962_node_hash(left: bytes, right: bytes) -> bytes:
    """Computes SHA-256(0x01 || left || right) as defined in RFC 6962 Section 2.1."""
    h = hashlib.sha256()
    h.update(b"\x01")
    h.update(left)
    h.update(right)
    return h.digest()


def largest_power_of_two_less_than(n: int) -> int:
    """Returns k = 2^floor(log2(n - 1)) for RFC 6962 tree decomposition."""
    if n <= 1:
        return 0
    k = 1
    while (k << 1) < n:
        k <<= 1
    return k


class RFC6962MerkleTree:
    """
    RFC 6962 Compliant Merkle Tree built over an ordered sequence of leaves.
    """
    def __init__(self, raw_leaves: Optional[List[bytes]] = None):
        self.raw_leaves = raw_leaves or []
        self.leaf_hashes: List[bytes] = [rfc6962_leaf_hash(d) for d in self.raw_leaves]
        self.root_hash = self._compute_mth(self.leaf_hashes)

    def _compute_mth(self, leaves: List[bytes]) -> bytes:
        """Merkle Tree Hash (MTH) calculation via RFC 6962 recursive definition."""
        n = len(leaves)
        if n == 0:
            return hashlib.sha256(b"").digest()
        if n == 1:
            return leaves[0]
        k = largest_power_of_two_less_than(n)
        left_root = self._compute_mth(leaves[:k])
        right_root = self._compute_mth(leaves[k:])
        return rfc6962_node_hash(left_root, right_root)

    def get_root_hex(self) -> str:
        return self.root_hash.hex()

    def generate_inclusion_proof(self, m: int) -> List[Dict[str, str]]:
        """
        Generates RFC 6962 inclusion proof (audit path) for leaf index m (0 <= m < n).
        Each step contains:
        - "direction": "left" (sibling is on the left) or "right" (sibling is on the right)
        - "hash": hex-encoded sibling hash
        """
        n = len(self.leaf_hashes)
        if m < 0 or m >= n:
            raise IndexError(f"Leaf index {m} out of bounds for tree of size {n}")

        def _sub_proof(m_sub: int, leaves_sub: List[bytes]) -> List[Dict[str, str]]:
            n_sub = len(leaves_sub)
            if n_sub <= 1:
                return []
            k = largest_power_of_two_less_than(n_sub)
            if m_sub < k:
                # Target is in left subtree, sibling is right subtree MTH
                right_mth = self._compute_mth(leaves_sub[k:])
                sub_path = _sub_proof(m_sub, leaves_sub[:k])
                sub_path.append({"direction": "right", "hash": right_mth.hex()})
                return sub_path
            else:
                # Target is in right subtree, sibling is left subtree MTH
                left_mth = self._compute_mth(leaves_sub[:k])
                sub_path = _sub_proof(m_sub - k, leaves_sub[k:])
                sub_path.append({"direction": "left", "hash": left_mth.hex()})
                return sub_path

        return _sub_proof(m, self.leaf_hashes)


def verify_rfc6962_proof(
    leaf_hash_hex: str,
    audit_path: List[Dict[str, str]],
    expected_root_hex: str,
) -> bool:
    """
    Independently verifies an RFC 6962 inclusion proof.
    Starting with the leaf hash, successively hashes with sibling hashes in the audit path.
    """
    current_hash = bytes.fromhex(leaf_hash_hex)

    for step in audit_path:
        sibling_hash = bytes.fromhex(step["hash"])
        direction = step["direction"]
        if direction == "left":
            # Sibling is left, current is right
            current_hash = rfc6962_node_hash(sibling_hash, current_hash)
        elif direction == "right":
            # Current is left, sibling is right
            current_hash = rfc6962_node_hash(current_hash, sibling_hash)
        else:
            return False

    return current_hash.hex() == expected_root_hex


def canonical_leaf_bytes(record: Dict[str, Any]) -> bytes:
    """
    Serializes an audit record into deterministic canonical UTF-8 bytes.
    """
    canonical_dict = {
        "id": int(record.get("id", 0)),
        "payment_id": str(record.get("payment_id", "")),
        "customer_id": str(record.get("customer_id", "")),
        "amount": round(float(record.get("amount", 0.0)), 2),
        "executed_action": str(record.get("executed_action", "")),
        "recovered": bool(record.get("recovered", False)),
        "timestamp": str(record.get("timestamp", "")),
    }
    return json.dumps(canonical_dict, sort_keys=True, separators=(",", ":")).encode("utf-8")
