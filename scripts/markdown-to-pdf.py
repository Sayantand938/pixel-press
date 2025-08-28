import argparse
import json
import os
import pypandoc

def convert_markdown_to_pdf(book_directory):
    """
    Reads chapter files based on metadata, prepends titles, combines them,
    and converts the final markdown string to a PDF using Pandoc,
    configured for duplex printing.
    """
    # --- CORRECTED PATHING LOGIC ---
    # Get the absolute path of the directory containing this script.
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Navigate up one level to the project root directory.
    project_root = os.path.dirname(script_dir)
    # Construct the correct, absolute path to the target book directory.
    full_book_directory_path = os.path.join(project_root, 'public', 'Books', book_directory)
    
    metadata_path = os.path.join(full_book_directory_path, 'metadata.json')

    # --- Input Validation ---
    if not os.path.isdir(full_book_directory_path):
        print(f"Error: Directory '{full_book_directory_path}' not found.")
        return

    if not os.path.isfile(metadata_path):
        print(f"Error: 'metadata.json' not found in '{full_book_directory_path}'.")
        return

    # --- Read and Parse Metadata ---
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Could not parse 'metadata.json'. Please check for syntax errors. Details: {e}")
        return

    title = metadata.get('title', 'Untitled')
    author = metadata.get('author', 'Unknown Author')
    chapters = metadata.get('chapters', [])

    if not chapters:
        print("Warning: No chapters found in metadata.json. PDF will not be generated.")
        return

    # --- Assemble Markdown Content ---
    full_markdown_parts = []
    # Sort chapters by the 'number' key to ensure correct order
    sorted_chapters = sorted(chapters, key=lambda x: x.get('number', 0))

    print("Assembling chapters...")
    for chapter in sorted_chapters:
        chapter_title = chapter.get('title')
        chapter_file = chapter.get('file')

        if not chapter_title or not chapter_file:
            print(f"Warning: Skipping a chapter due to missing 'title' or 'file' in metadata.json.")
            continue

        # Use full_book_directory_path for chapter file paths
        file_path = os.path.join(full_book_directory_path, chapter_file)
        if os.path.isfile(file_path):
            # Create a Markdown H1 header. This is CRUCIAL for the TOC and Bookmarks.
            heading = f"# {chapter_title}\n\n"

            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            full_markdown_parts.append(heading + content)
        else:
            print(f"Warning: Chapter file not found, skipping: {file_path}")

    if not full_markdown_parts:
        print("Error: No valid chapter content could be assembled. Aborting.")
        return

    # Join chapters with a LaTeX \cleardoublepage command to force chapters to start on a right-hand page.
    # Add one at the beginning to push the first chapter after the TOC page correctly.
    full_markdown_content = "\\cleardoublepage\n\n" + "\n\n\\cleardoublepage\n\n".join(full_markdown_parts)

    # --- Define Output and Pandoc Configuration ---
    # Use full_book_directory_path for output PDF path
    output_pdf = os.path.join(full_book_directory_path, f"{title}.pdf")
    print(f"Starting conversion of '{title}'...")

    pandoc_args = [
        # ADDED: Tell LaTeX to use a two-sided layout
        '-V', 'classoption=twoside',
        '--toc',
        '--toc-depth=3',
        '--pdf-engine=xelatex',
        '-V', 'mainfont=JetBrains Mono',
        # MODIFIED: Adjusted geometry for a binding margin (inner) and outer margin
        # ADDED: Explicitly set paper size to A4
        '-V', r'geometry:a4paper,top=20mm,bottom=20mm,inner=25mm,outer=15mm',
        '-V', r'header-includes=\usepackage{setspace}',
        '-V', r'header-includes=\setstretch{1.15}',
        '--metadata', f'title={title}',
        '--metadata', f'author={author}',
    ]

    # --- Pandoc Execution ---
    try:
        # Use convert_text since we have assembled a single string.
        # Specify the input format is 'md' (Markdown).
        pypandoc.convert_text(
            source=full_markdown_content,
            format='md',
            to='pdf',
            outputfile=output_pdf,
            extra_args=pandoc_args
        )
        print(f"\nSuccessfully created '{output_pdf}'")

    except (RuntimeError, FileNotFoundError) as e:
        print(f"\nAn error occurred during PDF conversion: {e}")
        print("Please ensure Pandoc and a LaTeX distribution (like MiKTeX, MacTeX, or TeX Live) are installed and accessible in your system's PATH.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")


if __name__ == '__main__':
    # --- Command-Line Argument Parsing ---
    parser = argparse.ArgumentParser(
        description='Converts a directory of markdown chapters into a single PDF file using Pandoc.'
    )
    parser.add_argument(
        'book_directory',
        type=str,
        help='The name of the book directory (e.g., "Verity") which is located under the "public/Books/" folder.'
    )
    args = parser.parse_args()

    convert_markdown_to_pdf(args.book_directory)