import ExcelJS from 'exceljs'

interface ExportData {
  profile: Record<string, unknown>
  income?: Record<string, unknown>
  allocation?: Record<string, unknown>
  withdrawal?: Record<string, unknown>
  propertyData?: Record<string, unknown>
}

export async function exportToExcel(data: ExportData): Promise<void> {
  const wb = new ExcelJS.Workbook()

  function addSheet(name: string, obj: Record<string, unknown>) {
    const ws = wb.addWorksheet(name)
    ws.addRow(['Field', 'Value'])
    for (const [key, value] of Object.entries(obj)) {
      if (key !== 'validationErrors') {
        ws.addRow([key, String(value)])
      }
    }
    ws.getColumn(1).width = 30
    ws.getColumn(2).width = 40
  }

  addSheet('Profile', data.profile)
  if (data.income) addSheet('Income', data.income)
  if (data.allocation) addSheet('Allocation', data.allocation)
  if (data.withdrawal) addSheet('Withdrawal', data.withdrawal)
  if (data.propertyData) addSheet('Property', data.propertyData)

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'fireplanner-export.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}
