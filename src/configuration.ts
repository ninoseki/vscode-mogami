import * as vscode from 'vscode'
import { z } from 'zod'

import {
  ConcurrencyKey,
  DisableCodeLensKey,
  DisableHoverKey,
  EnableCodeLensKey,
  ExtID,
  showPrerelease,
  usePrivateSourceKey,
} from '@/constants'
import { ProjectFormatSchema, ProjectFormatType } from '@/schemas'

export function getEnableCodeLens() {
  return vscode.workspace.getConfiguration(ExtID).get(EnableCodeLensKey, true)
}

export function getConcurrency() {
  return vscode.workspace.getConfiguration(ExtID).get(ConcurrencyKey, 5)
}

export function getUsePrivateSource() {
  return vscode.workspace.getConfiguration(ExtID).get(usePrivateSourceKey, true)
}

export function getShowPrerelease() {
  return vscode.workspace.getConfiguration(ExtID).get(showPrerelease, false)
}

const DisabledFormatsSchema = z.array(ProjectFormatSchema)

function getDisabledFormats(key: string): ProjectFormatType[] {
  const raw = vscode.workspace.getConfiguration(ExtID).get<unknown>(key, [])
  const parsed = DisabledFormatsSchema.safeParse(raw)
  return parsed.success ? parsed.data : []
}

export function getDisabledHoverFormats(): ProjectFormatType[] {
  return getDisabledFormats(DisableHoverKey)
}

export function getDisabledCodeLensFormats(): ProjectFormatType[] {
  return getDisabledFormats(DisableCodeLensKey)
}
