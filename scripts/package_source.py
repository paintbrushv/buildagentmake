from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent
names=['index.html','app.js','domain.js','rfq.js','scenarios.js','styles.css','package.json','README.md','DEMO_SCRIPT.md','RELEASE_EVIDENCE.md','SUBMISSION.md','LOCAL_COMPONENT_DEMOS.md','LICENSE','.gitignore','scripts/build.mjs','scripts/package_source.py','test/domain.test.js','test/scenarios.test.js','test/intake-search.test.js','test/rfq.test.js']
(root/'dist').mkdir(exist_ok=True)
with zipfile.ZipFile(root/'dist/source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in names:z.write(root/name,Path('forgepath-supplier-desk')/name)
with zipfile.ZipFile(root/'dist/source.zip') as z:
 assert z.testzip() is None
print(f'Source bundle: {len(names)} files, no private repositories or credentials.')
