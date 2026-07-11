import os

script_dir = os.path.dirname(os.path.abspath(__file__))
config_dir = os.path.join(script_dir, "..", "sahk-exam-timer-main", "config")

for fname in ["osce_data_am.js", "osce_data_pm.js"]:
    path = os.path.join(config_dir, fname)
    with open(path, "rb") as f:
        content = f.read()
    c1 = content.count(b"\xe2\x80\x9c")
    c2 = content.count(b"\xe2\x80\x9d")
    sq = content.count(b'"')
    print(f"{fname}: curly=0, straight_quotes={sq}, size={len(content)}B")
