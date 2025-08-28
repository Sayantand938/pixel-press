import argparse
import os
import re

class MarkdownAutoFixer:
    def __init__(self, filepath):
        self.filepath = filepath

    def auto_fix(self):
        """
        Reads, fixes, and overwrites the markdown file with corrected content.
        """
        if not os.path.isfile(self.filepath):
            print(f"Error: File not found at '{self.filepath}'")
            return

        print(f"Linting and fixing {self.filepath}...")

        with open(self.filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Apply all fixing rules in sequence
        lines = self.fix_trailing_spaces(lines)
        lines = self.fix_paragraph_blank_lines(lines) # This is the corrected function
        lines = self.fix_list_markers(lines)
        lines = self.fix_tabs_in_code_blocks(lines)
        lines = self.fix_images_alt_text(lines)
        lines = self.fix_headings(lines)
        lines = self.fix_horizontal_rules(lines)
        lines = self.ensure_final_newline(lines)

        with open(self.filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        
        print("Fixing complete.")

    # ---------------- Fixing Rules ----------------

    def fix_trailing_spaces(self, lines):
        return [line.rstrip() + '\n' for line in lines]

    def fix_paragraph_blank_lines(self, lines):
        """
        CORRECTED: Ensures paragraphs are separated by exactly one blank line
        and collapses multiple consecutive blank lines into one.
        """
        fixed_lines = []
        in_code_block = False
        # State to track if the last line added to fixed_lines was blank
        last_line_was_blank = True # Treat start of file as a blank line

        for line in lines:
            stripped_line = line.strip()

            if stripped_line.startswith('```'):
                in_code_block = not in_code_block
                fixed_lines.append(line)
                last_line_was_blank = False
                continue

            if in_code_block:
                fixed_lines.append(line)
                last_line_was_blank = False
                continue

            if not stripped_line: # Current line is blank or whitespace
                if not last_line_was_blank:
                    # The previous line had content, so we add one blank line.
                    fixed_lines.append('\n')
                    last_line_was_blank = True
                # If the last line was already blank, we do nothing, collapsing multiple blanks.
            else: # Current line has content
                fixed_lines.append(line)
                last_line_was_blank = False
        
        # After the loop, trim any trailing blank lines from the end of the file.
        while fixed_lines and fixed_lines[-1].strip() == '':
            fixed_lines.pop()

        return fixed_lines

    def fix_list_markers(self, lines):
        fixed = []
        for line in lines:
            # Standardize unordered list markers (*, +) to (-)
            match = re.match(r'^(\s*)[*+]\s+', line)
            if match:
                line = line.replace(match.group(0), match.group(1) + '- ')
            fixed.append(line)
        return fixed

    def fix_tabs_in_code_blocks(self, lines):
        fixed = []
        in_code_block = False
        for line in lines:
            if line.strip().startswith('```'):
                in_code_block = not in_code_block
            if in_code_block and not line.strip().startswith('```'):
                line = line.replace('\t', '  ')  # convert tabs to 2 spaces
            fixed.append(line)
        return fixed

    def fix_images_alt_text(self, lines):
        fixed = []
        for line in lines:
            # Add "Image" as alt text if it is missing
            line = re.sub(r'!\[\s*\]\(', '![Image](', line)
            fixed.append(line)
        return fixed

    def fix_headings(self, lines):
        fixed = []
        h1_seen = False
        for line in lines:
            match = re.match(r'^(#+)\s*(.*)', line)
            if match:
                level, text = match.groups()
                # Ensure only one H1 per file, downgrade others to H2
                if level == '#' and not h1_seen:
                    h1_seen = True
                elif level == '#' and h1_seen:
                    level = '##'
                # Standardize spacing and add a newline
                line = f"{level} {text.strip()}\n"
            fixed.append(line)
        return fixed

    def fix_horizontal_rules(self, lines):
        fixed = []
        for line in lines:
            # Standardize horizontal rules to ---
            if re.match(r'^\s*(\*\*\*|---|___)\s*$', line.strip()):
                line = '---\n'
            fixed.append(line)
        return fixed

    def ensure_final_newline(self, lines):
        if lines and not lines[-1].endswith('\n'):
            lines[-1] += '\n'
        elif not lines:
            lines.append('\n')
        return lines

# ---------------- Main CLI ----------------

def main():
    parser = argparse.ArgumentParser(
        description="A script to automatically lint and fix common issues in Markdown files.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "--input", 
        required=True, 
        help="Path to the Markdown file to fix.\nCan be an absolute path or a path relative to the project root."
    )
    args = parser.parse_args()

    # --- ROBUST PATHING ---
    # Get the project root directory (which is two levels up from this script)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    # Resolve the input file path relative to the project root.
    # This makes the script work correctly even if the path is relative.
    # os.path.abspath will handle cases where the user provides an absolute path already.
    file_path = os.path.join(project_root, args.input)
    
    # In case the user provided an absolute path, abspath might combine them incorrectly.
    # A better way is to check if the input is absolute first.
    if os.path.isabs(args.input):
        file_path = args.input
    else:
        file_path = os.path.abspath(os.path.join(project_root, args.input))


    fixer = MarkdownAutoFixer(file_path)
    fixer.auto_fix()

if __name__ == "__main__":
    main()