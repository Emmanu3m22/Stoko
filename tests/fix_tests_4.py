import os
import glob

tests_dir = r'c:\Users\emmor\Local Documents\ITTOL\6 semestre\Ing Software\Stoko_Project\stoko\tests\e2e'

for file_path in glob.glob(os.path.join(tests_dir, '*.spec.ts')):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # rf06
    if 'rf06' in file_path:
        content = content.replace("await page.waitForTimeout(500);", "await page.waitForTimeout(600);")
        content = content.replace("text=Nueva Venta", "text=Nueva venta")

    # rf10
    if 'rf10' in file_path:
        content = content.replace(
            "const menuMermas = page.locator('text=/Mermas/i, text=/Análisis/i').first();\n    if (await menuMermas.isVisible()) {\n      await menuMermas.click();\n    }",
            "const menuReportes = page.locator('text=Reportes').first();\n    if (await menuReportes.isVisible()) {\n      await menuReportes.click();\n    }\n    const tabMermas = page.locator('text=Registro de Mermas').first();\n    if (await tabMermas.isVisible()) {\n      await tabMermas.click();\n    }"
        )
        # Fix input cantidad (no name="cantidad" in frontend, let's use placeholder or label)
        # Actually RegistroMerma has inputs. We'll use getByPlaceholder if needed. Let's see RegistroMerma.jsx

    # rf11
    if 'rf11' in file_path:
        content = content.replace(
            "const menuReportes = page.locator('text=/Reportes/i, text=/Insights/i, text=/Auditoría/i').first();\n    if (await menuReportes.isVisible()) {\n      await menuReportes.click();\n    }",
            "const menuReportes = page.locator('text=Reportes').first();\n    if (await menuReportes.isVisible()) {\n      await menuReportes.click();\n    }\n    const tabInsights = page.locator('text=IA Insights (Gemini)').first();\n    if (await tabInsights.isVisible()) {\n      await tabInsights.click();\n    }"
        )
        content = content.replace(
            "const tabAuditoria = page.locator('text=/Historial de Operaciones/i, text=/Auditorías/i, text=/Bitácora/i').first();\n    if (await tabAuditoria.isVisible()) {\n      await tabAuditoria.click();\n    }",
            "const tabAuditoria = page.locator('text=Historial de Operaciones').first();\n    if (await tabAuditoria.isVisible()) {\n      await tabAuditoria.click();\n    }"
        )

    # rf12
    if 'rf12' in file_path:
        content = content.replace(
            "const menuReportes = page.locator('text=/Exportar/i, text=/Reportes/i').first();\n    if (await menuReportes.isVisible()) {\n      await menuReportes.click();\n    }",
            "const menuReportes = page.locator('text=Reportes').first();\n    if (await menuReportes.isVisible()) {\n      await menuReportes.click();\n    }\n    const tabExportar = page.locator('text=Exportar Reportes').first();\n    if (await tabExportar.isVisible()) {\n      await tabExportar.click();\n    }"
        )

    # rf08
    if 'rf08' in file_path:
        content = content.replace(
            "const menuReportes = page.locator('text=/Cortes/i, text=/Caja/i, text=/Reportes/i').first();\n    if (await menuReportes.isVisible()) {\n      await menuReportes.click();\n    }",
            "const menuReportes = page.locator('text=Reportes').first();\n    if (await menuReportes.isVisible()) {\n      await menuReportes.click();\n    }\n    const tabCorte = page.locator('text=Cierre de Turno').first();\n    if (await tabCorte.isVisible()) {\n      await tabCorte.click();\n    }"
        )

    # rf09
    if 'rf09' in file_path:
        content = content.replace(
            "const menuStock = page.locator('text=/Stock/i, text=/Inventario/i').first();",
            "const menuStock = page.locator('text=Catálogo').first();"
        )
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done fixing missing tabs')
