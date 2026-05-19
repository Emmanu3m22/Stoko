import os

tests_dir = r'c:\Users\emmor\Local Documents\ITTOL\6 semestre\Ing Software\Stoko_Project\stoko\tests\e2e'

# Fix RF06
file_rf06 = os.path.join(tests_dir, 'rf06_registrar_venta.spec.ts')
with open(file_rf06, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(
    "page.locator('text=Nueva venta').first().or(page.locator('text=Registro de Venta').first())",
    "page.locator('button', { hasText: 'Nueva venta' }).first()"
)
with open(file_rf06, 'w', encoding='utf-8') as f:
    f.write(c)

# Fix RF07
file_rf07 = os.path.join(tests_dir, 'rf07_anular_venta.spec.ts')
with open(file_rf07, 'r', encoding='utf-8') as f:
    c07 = f.read()
c07 = c07.replace(
    "const tabAuditoria = page.locator('text=/Historial de Operaciones/i, text=/Auditorías/i, text=/Bitácora/i').first();\n      if (await tabAuditoria.isVisible()) {\n        await tabAuditoria.click();\n      }",
    "const menuReportes = page.locator('text=Reportes').first();\n      if (await menuReportes.isVisible()) {\n        await menuReportes.click();\n      }\n      const tabAuditoria = page.locator('button', { hasText: 'Historial de Operaciones' }).first();\n      if (await tabAuditoria.isVisible()) {\n        await tabAuditoria.click();\n      }"
)
with open(file_rf07, 'w', encoding='utf-8') as f:
    f.write(c07)

print("Done fixing RF06 and RF07")
