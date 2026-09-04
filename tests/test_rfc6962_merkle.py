"""
Unit Tests for RFC 6962 Merkle Audit Tree & Inclusion Proof Verification.
Tests prefixing (0x00 / 0x01), power-of-2 splitting, proof generation, and tamper detection.
"""
import pytest
import hashlib
from backend.crypto_merkle import (
    RFC6962MerkleTree,
    rfc6962_leaf_hash,
    rfc6962_node_hash,
    verify_rfc6962_proof,
    canonical_leaf_bytes,
    largest_power_of_two_less_than,
)


def test_rfc6962_leaf_and_node_prefixes():
    """Verify that leaf prefix 0x00 and node prefix 0x01 are strictly prepended."""
    data = b"payment_tx_12345"
    leaf_h = rfc6962_leaf_hash(data)

    # Manual verification of leaf hash
    expected_leaf = hashlib.sha256(b"\x00" + data).digest()
    assert leaf_h == expected_leaf

    # Manual verification of node hash
    left = hashlib.sha256(b"left").digest()
    right = hashlib.sha256(b"right").digest()
    node_h = rfc6962_node_hash(left, right)
    expected_node = hashlib.sha256(b"\x01" + left + right).digest()
    assert node_h == expected_node


def test_power_of_two_decomposition():
    """Verify power-of-2 split rule: k = 2^(floor(log2(n - 1)))."""
    cases = [
        (2, 1),
        (3, 2),
        (4, 2),
        (5, 4),
        (6, 4),
        (7, 4),
        (8, 4),
        (9, 8),
        (16, 8),
        (17, 16),
    ]
    for n, expected_k in cases:
        assert largest_power_of_two_less_than(n) == expected_k


def test_single_leaf_tree():
    """Single leaf tree has root == leaf_hash and empty audit path."""
    leaf_data = b"only_one_transaction"
    tree = RFC6962MerkleTree([leaf_data])
    leaf_h = rfc6962_leaf_hash(leaf_data).hex()

    assert tree.get_root_hex() == leaf_h
    proof = tree.generate_inclusion_proof(0)
    assert proof == []
    assert verify_rfc6962_proof(leaf_h, proof, tree.get_root_hex()) is True


def test_two_leaf_tree():
    """Two leaf tree root == SHA256(0x01 || leaf0 || leaf1)."""
    l0 = b"tx_0"
    l1 = b"tx_1"
    tree = RFC6962MerkleTree([l0, l1])

    h0 = rfc6962_leaf_hash(l0)
    h1 = rfc6962_leaf_hash(l1)
    expected_root = rfc6962_node_hash(h0, h1).hex()

    assert tree.get_root_hex() == expected_root

    # Leaf 0 proof: sibling h1 is to the right
    p0 = tree.generate_inclusion_proof(0)
    assert len(p0) == 1
    assert p0[0]["direction"] == "right"
    assert p0[0]["hash"] == h1.hex()
    assert verify_rfc6962_proof(h0.hex(), p0, expected_root) is True

    # Leaf 1 proof: sibling h0 is to the left
    p1 = tree.generate_inclusion_proof(1)
    assert len(p1) == 1
    assert p1[0]["direction"] == "left"
    assert p1[0]["hash"] == h0.hex()
    assert verify_rfc6962_proof(h1.hex(), p1, expected_root) is True


@pytest.mark.parametrize("tree_size", [3, 4, 5, 7, 8, 11, 16])
def test_arbitrary_tree_size_proof_verification(tree_size):
    """Verify that all leaves in trees of arbitrary sizes (even & odd) generate valid proofs."""
    leaves = [f"transaction_record_{i}".encode("utf-8") for i in range(tree_size)]
    tree = RFC6962MerkleTree(leaves)
    root = tree.get_root_hex()

    for idx in range(tree_size):
        leaf_h = rfc6962_leaf_hash(leaves[idx]).hex()
        proof = tree.generate_inclusion_proof(idx)
        assert verify_rfc6962_proof(leaf_h, proof, root) is True


def test_tamper_detection():
    """Verify that modifying any byte in leaf or proof invalidates cryptographic verification."""
    leaves = [f"audit_item_{i}".encode("utf-8") for i in range(6)]
    tree = RFC6962MerkleTree(leaves)
    root = tree.get_root_hex()

    leaf_h = rfc6962_leaf_hash(leaves[2]).hex()
    proof = tree.generate_inclusion_proof(2)

    # 1. Valid proof passes
    assert verify_rfc6962_proof(leaf_h, proof, root) is True

    # 2. Tampered leaf hash fails
    tampered_leaf = "f" * 64
    assert verify_rfc6962_proof(tampered_leaf, proof, root) is False

    # 3. Tampered root fails
    tampered_root = "0" * 64
    assert verify_rfc6962_proof(leaf_h, proof, tampered_root) is False

    # 4. Tampered sibling hash in proof fails
    tampered_proof = [
        {"direction": p["direction"], "hash": "a" * 64 if i == 0 else p["hash"]}
        for i, p in enumerate(proof)
    ]
    assert verify_rfc6962_proof(leaf_h, tampered_proof, root) is False


def test_canonical_leaf_serialization():
    """Verify deterministic JSON ordering regardless of dict key creation order."""
    r1 = {"id": 1, "payment_id": "pay_1", "amount": 100.5, "recovered": True, "executed_action": "RETRY_NOW", "timestamp": "2026-09-04"}
    r2 = {"timestamp": "2026-09-04", "executed_action": "RETRY_NOW", "recovered": True, "amount": 100.5, "payment_id": "pay_1", "id": 1}

    b1 = canonical_leaf_bytes(r1)
    b2 = canonical_leaf_bytes(r2)

    assert b1 == b2
