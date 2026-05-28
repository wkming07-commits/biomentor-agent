from playwright.sync_api import sync_playwright
import os

output_dir = r"D:\BioMentor Agent\dogfood-output\screenshots"
os.makedirs(output_dir, exist_ok=True)

pages = [
    ("/tools/protein", "toolbox-protein"),
    ("/tools/plasmid", "toolbox-plasmid"),
    ("/tools/sequence", "toolbox-sequence"),
    ("/tools/pathway", "toolbox-pathway"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    errors = []

    for route, name in pages:
        print(f"\n--- Testing {route} ---")
        try:
            page.goto(f"http://localhost:3001{route}", timeout=15000)
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path=f"{output_dir}\\{name}.png", full_page=True)
            print(f"  Screenshot saved: {name}.png")

            # Check for console errors
            console_msgs = []
            page.on("console", lambda msg: console_msgs.append(msg))
            page.reload()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)

            err_msgs = [m for m in console_msgs if m.type == "error"]
            if err_msgs:
                for em in err_msgs[:5]:
                    print(f"  CONSOLE ERROR: {em.text[:200]}")
                    errors.append(f"{route}: {em.text[:200]}")
            else:
                print(f"  No console errors")

            # Verify BioMentorToolChat presence
            has_ai = page.locator('text=BioMentor AI').count()
            has_chat = page.locator('[placeholder*="输入你的问题"]').count()
            print(f"  BioMentor AI title: {'YES' if has_ai else 'NO'}")
            print(f"  Chat input: {'YES' if has_chat else 'NO'}")

        except Exception as e:
            print(f"  ERROR: {e}")
            errors.append(f"{route}: {str(e)[:200]}")

    browser.close()

    print("\n" + "="*50)
    print(f"Dogfood QA Complete")
    print(f"Total errors: {len(errors)}")
    if errors:
        for e in errors:
            print(f"  - {e}")
    else:
        print("All pages loaded successfully with no console errors!")
