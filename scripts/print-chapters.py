import PyPDF2
import os
import sys
import json
import argparse

# --- IMPROVED: Define a predictable temporary directory inside the scripts folder ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_OUTPUT_DIR = os.path.join(SCRIPT_DIR, "temp_chapter_output")

def read_pdf_outline(pdf_path):
    """
    Reads a PDF file and extracts its Table of Contents (outline) entries.
    """
    outline_data = []
    total_pages = 0
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            total_pages = len(reader.pages)

            if not reader.outline:
                return [], total_pages # Return early if no outline exists

            # Helper function to recursively process outline items
            def process_outline(items):
                for item in items:
                    if isinstance(item, PyPDF2.generic.Destination):
                        title = item.title
                        page_index = reader.get_destination_page_number(item)
                        if page_index is not None:
                            outline_data.append({'title': title, 'page_index': page_index})
                    elif isinstance(item, list):
                        # Recurse for nested chapters/sections
                        process_outline(item)
            
            process_outline(reader.outline)
            return outline_data, total_pages

    except PyPDF2.errors.PdfReadError as e:
        print(f"Error reading PDF: {e}. The PDF might be corrupted or encrypted.")
    except Exception as e:
        print(f"An unexpected error occurred while reading the PDF outline: {e}")
    return [], 0

def extract_and_split_chapter(pdf_path, chapter_title, start_page_index, end_page_index):
    """
    Extracts a chapter into a new PDF, then splits it into odd and even pages.
    """
    try:
        os.makedirs(TEMP_OUTPUT_DIR, exist_ok=True)

        with open(pdf_path, 'rb') as infile:
            reader = PyPDF2.PdfReader(infile)
            
            sanitized_title = "".join(c for c in chapter_title if c.isalnum() or c in (' ', '_')).rstrip().replace(' ', '_')

            chapter_pdf_writer = PyPDF2.PdfWriter()
            for i in range(start_page_index, end_page_index + 1):
                if 0 <= i < len(reader.pages):
                    chapter_pdf_writer.add_page(reader.pages[i])

            chapter_filename = os.path.join(TEMP_OUTPUT_DIR, f"{sanitized_title}.pdf")
            with open(chapter_filename, 'wb') as outfile:
                chapter_pdf_writer.write(outfile)
            print(f"\nSuccessfully extracted '{chapter_title}' to '{chapter_filename}'.")

            # --- Split the extracted chapter PDF ---
            chapter_reader = PyPDF2.PdfReader(chapter_filename)
            odd_writer = PyPDF2.PdfWriter()
            even_writer = PyPDF2.PdfWriter()

            for i in range(len(chapter_reader.pages)):
                if (i + 1) % 2 != 0: # Odd page
                    odd_writer.add_page(chapter_reader.pages[i])
                else: # Even page
                    even_writer.add_page(chapter_reader.pages[i])

            if odd_writer.pages:
                odd_filename = os.path.join(TEMP_OUTPUT_DIR, f"{sanitized_title}_odd.pdf")
                with open(odd_filename, 'wb') as outfile:
                    odd_writer.write(outfile)
                print(f"Odd pages saved to '{odd_filename}'.")

            if even_writer.pages:
                even_filename = os.path.join(TEMP_OUTPUT_DIR, f"{sanitized_title}_even.pdf")
                with open(even_filename, 'wb') as outfile:
                    even_writer.write(outfile)
                print(f"Even pages saved to '{even_filename}'.")

    except Exception as e:
        print(f"An error occurred during chapter extraction or splitting: {e}")

# --- Main execution block ---
if __name__ == "__main__":
    # --- CORRECTED: Use argparse for better CLI argument handling ---
    parser = argparse.ArgumentParser(
        description='Extracts a chapter from a book\'s PDF and splits it into odd/even pages for printing.'
    )
    parser.add_argument(
        'book_directory',
        type=str,
        help='The name of the book directory (e.g., "Verity") located under "public/Books/".'
    )
    args = parser.parse_args()

    # --- CORRECTED: Robust pathing logic ---
    project_root = os.path.dirname(SCRIPT_DIR)
    book_path = os.path.join(project_root, 'public', 'Books', args.book_directory)
    metadata_path = os.path.join(book_path, 'metadata.json')
    
    if not os.path.isdir(book_path):
        print(f"Error: The book directory was not found at '{book_path}'")
        sys.exit(1)

    # Determine the PDF path by reading the title from metadata.json
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        book_title = metadata.get('title')
        if not book_title:
            raise ValueError("'title' not found in metadata.json")
    except (FileNotFoundError, json.JSONDecodeError, ValueError) as e:
        print(f"Error reading book metadata: {e}. Could not determine PDF filename.")
        sys.exit(1)

    pdf_path_from_arg = os.path.join(book_path, f"{book_title}.pdf")

    if not os.path.exists(pdf_path_from_arg):
        print(f"Error: The PDF file '{os.path.basename(pdf_path_from_arg)}' does not exist in '{book_path}'.")
        sys.exit(1)

    print(f"Reading outline from: {pdf_path_from_arg}")
    outline_entries, total_pages = read_pdf_outline(pdf_path_from_arg)

    if not outline_entries:
        print("No Table of Contents (outline) found in the PDF or an error occurred.")
        sys.exit(0)

    print("\nAvailable Chapters:")
    for i, entry in enumerate(outline_entries):
        print(f"{i + 1}. {entry['title']} (Starts on Page: {entry['page_index'] + 1})")

    while True:
        try:
            choice = input("\nEnter the number of the chapter to extract (or 'q' to quit): ")
            if choice.lower() == 'q':
                print("Exiting.")
                break

            choice_num = int(choice)
            if 1 <= choice_num <= len(outline_entries):
                selected_index = choice_num - 1
                selected_chapter = outline_entries[selected_index]
                start_page = selected_chapter['page_index']
                
                # Determine end page: page before the next chapter starts, or the last page
                if selected_index + 1 < len(outline_entries):
                    end_page = outline_entries[selected_index + 1]['page_index'] - 1
                else:
                    end_page = total_pages - 1
                
                if end_page < start_page: end_page = start_page # Handle single-page chapters

                print(f"Extracting '{selected_chapter['title']}' (Pages {start_page + 1} to {end_page + 1})...")
                extract_and_split_chapter(pdf_path_from_arg, selected_chapter['title'], start_page, end_page)
                break
            else:
                print("Invalid choice. Please enter a number from the list.")
        except ValueError:
            print("Invalid input. Please enter a number or 'q'.")