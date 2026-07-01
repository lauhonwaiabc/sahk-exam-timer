import os

script_dir = os.path.dirname(os.path.abspath(__file__))
config_dir = os.path.join(script_dir, "..", "sahk-exam-timer-main", "config")

for fname in ["osce_data_am.js", "osce_data_pm.js"]:
    path = os.path.join(config_dir, fname)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    # Replace curly double quotes with straight quotes
    content = content.replace("\u201c", '"')
    content = content.replace("\u201d", '"')
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(content)
    print(f"Fixed {fname}")
