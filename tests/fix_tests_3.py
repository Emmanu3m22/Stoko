import os
import glob

tests_dir = r'c:\Users\emmor\Local Documents\ITTOL\6 semestre\Ing Software\Stoko_Project\stoko\tests\e2e'

# Fix RF07
file_rf07 = os.path.join(tests_dir, 'rf07_anular_venta.spec.ts')
with open(file_rf07, 'r', encoding='utf-8') as f:
    c07 = f.read()
c07 = c07.replace("filaVenta.locator('button').nth(1)", "filaVenta.locator('button', { hasText: 'Anular' }).first()")
with open(file_rf07, 'w', encoding='utf-8') as f:
    f.write(c07)

print('Done fixing RF07')
