#!/usr/bin/env python3
"""
Download protein structures for ExtendAI Lab website.
Usage: python download_structures.py
"""

import urllib.request
import os

# Create directories
os.makedirs('docs/data/pdb', exist_ok=True)

# Proteins to download
PROTEINS = {
    '1a3n': {
        'name': 'Hemoglobin (deoxy)',
        'desc': 'Human deoxyhemoglobin at 1.74 Å resolution',
        'chains': 'α₂β₂ tetramer'
    },
    '1hho': {
        'name': 'Hemoglobin (oxy)',
        'desc': 'Human oxyhemoglobin at 2.1 Å resolution',
        'chains': 'α₂β₂ tetramer'
    },
    '2hhb': {
        'name': 'Hemoglobin',
        'desc': 'Human deoxyhemoglobin at 1.74 Å',
        'chains': 'α₂β₂ tetramer'
    }
}

# AlphaFold structures
ALPHAFOLD = {
    'P69905': {
        'name': 'Hemoglobin subunit alpha',
        'uniprot': 'P69905',
        'gene': 'HBA1'
    },
    'P68871': {
        'name': 'Hemoglobin subunit beta',
        'uniprot': 'P68871',
        'gene': 'HBB'
    }
}

def download_pdb(pdb_id, output_dir='docs/data/pdb'):
    """Download PDB file from RCSB."""
    url = f'https://files.rcsb.org/download/{pdb_id.upper()}.pdb'
    output = os.path.join(output_dir, f'{pdb_id.lower()}.pdb')
    
    print(f'Downloading {pdb_id.upper()}...')
    try:
        urllib.request.urlretrieve(url, output)
        print(f'  ✓ Saved to {output}')
        return True
    except Exception as e:
        print(f'  ✗ Failed: {e}')
        return False

def download_alphafold(uniprot_id, output_dir='docs/data/pdb'):
    """Download AlphaFold predicted structure."""
    url = f'https://alphafold.ebi.ac.uk/files/AF-{uniprot_id}-F1-model_v4.pdb'
    output = os.path.join(output_dir, f'AF_{uniprot_id}.pdb')
    
    print(f'Downloading AlphaFold {uniprot_id}...')
    try:
        urllib.request.urlretrieve(url, output)
        print(f'  ✓ Saved to {output}')
        return True
    except Exception as e:
        print(f'  ✗ Failed: {e}')
        return False

def save_hbb_sequence():
    """Save HBB amino acid sequence."""
    # Human Hemoglobin subunit beta sequence
    hbb_seq = "MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH"
    
    # Color coding by amino acid properties
    # Nonpolar: A, V, I, L, M, F, W, P (hydrophobic)
    # Polar: S, T, C, Y, N, Q
    # Positive: K, R, H
    # Negative: D, E
    # Special: G
    
    aa_properties = {
        'A': 'nonpolar', 'V': 'nonpolar', 'I': 'nonpolar', 'L': 'nonpolar',
        'M': 'nonpolar', 'F': 'nonpolar', 'W': 'nonpolar', 'P': 'nonpolar',
        'S': 'polar', 'T': 'polar', 'C': 'polar', 'Y': 'polar',
        'N': 'polar', 'Q': 'polar',
        'K': 'positive', 'R': 'positive', 'H': 'positive',
        'D': 'negative', 'E': 'negative',
        'G': 'special'
    }
    
    output_path = 'docs/data/hbb_sequence.json'
    import json
    
    data = {
        'name': 'Hemoglobin subunit beta (HBB)',
        'organism': 'Homo sapiens',
        'length': len(hbb_seq),
        'sequence': hbb_seq,
        'properties': aa_properties,
        'colors': {
            'nonpolar': '#ff6b6b',  # Red
            'polar': '#00d4ff',      # Cyan
            'positive': '#00ff88',   # Green
            'negative': '#ffd700',   # Gold
            'special': '#b0b0b0'     # Gray
        }
    }
    
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f'✓ Saved HBB sequence to {output_path}')

def main():
    print('=== Downloading Protein Structures ===\n')
    
    # Download PDB structures
    print('--- RCSB PDB Structures ---')
    for pdb_id in PROTEINS:
        download_pdb(pdb_id)
    
    # Download AlphaFold structures
    print('\n--- AlphaFold Structures ---')
    for uniprot_id in ALPHAFOLD:
        download_alphafold(uniprot_id)
    
    # Save sequence data
    print('\n--- Sequence Data ---')
    save_hbb_sequence()
    
    print('\n=== Done! ===')
    print('\nFiles saved to docs/data/')
    print('These will be served via GitHub Pages')

if __name__ == '__main__':
    main()
