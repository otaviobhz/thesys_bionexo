import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import * as fs from 'fs/promises'
import * as path from 'path'

export type DocCategoria = 'manual' | 'instrucao'

interface DocMeta {
  filename: string
  title: string
  description: string
  ordem: number
  categoria: DocCategoria
}

/**
 * DocsService — expõe documentação markdown do projeto via API protegida.
 *
 * Filosofia:
 * - Whitelist explícita de arquivos (segurança contra path traversal)
 * - Serve docs/* do filesystem (single source of truth = repo)
 * - Read-only — nunca grava nada
 * - Propósito: keyuser consultar manuais sem sair do portal
 */
@Injectable()
export class DocsService {
  private readonly logger = new Logger(DocsService.name)

  /**
   * Lista whitelisted de docs disponíveis no portal.
   * Para adicionar nova doc: criar entry aqui + colocar arquivo em docs/.
   */
  private readonly DOCS: DocMeta[] = [
    // ===== Categoria: manual (página /documentacao) =====
    {
      filename: 'MANUAL_HOMOLOGACAO.md',
      title: 'Manual de Homologação',
      description: 'Roteiro passo a passo para validar o portal antes de uso real',
      ordem: 1,
      categoria: 'manual',
    },
    {
      filename: 'HOMOLOGACAO_TICKLIST.md',
      title: 'Checklist de Homologação',
      description: '90+ itens para marcar conforme cada feature é testada',
      ordem: 2,
      categoria: 'manual',
    },
    {
      filename: 'MANUAL_USUARIO_PORTAL_THESYS_BIONEXO.md',
      title: 'Manual do Usuário (uso diário)',
      description: 'Como usar o portal no dia-a-dia: filtros, classificação, envio',
      ordem: 3,
      categoria: 'manual',
    },
    {
      filename: 'CLASSIFICACAO_E_PAREAMENTO.md',
      title: 'Fluxo de Classificação e Pareamento',
      description: 'Como o operador classifica itens, faz pareamento SKU e ensina o sistema',
      ordem: 4,
      categoria: 'manual',
    },
    {
      filename: 'COMO_CONFIGURAR.md',
      title: 'Como Configurar o Portal',
      description: 'Setup inicial de Bionexo, Thesys, polling automático',
      ordem: 5,
      categoria: 'manual',
    },

    // ===== Manual de Funcionamento (visão geral + roteiro E2E em 1 só doc) =====
    {
      filename: 'MANUAL_FUNCIONAMENTO.md',
      title: 'Manual de Funcionamento',
      description: 'Visão geral do sistema + roteiro E2E em 1 documento (Parte 1: como funciona, Parte 2: 9 passos para testar)',
      ordem: 6,
      categoria: 'manual',
    },

    // ===== Roleplay de Onboarding (tutorial interativo) =====
    {
      filename: 'ROLEPLAY_ONBOARDING.md',
      title: 'Guia de Onboarding (Roleplay)',
      description: 'Tutorial passo a passo para operador novo: 7 cenas do fluxo completo de cotação',
      ordem: 7,
      categoria: 'manual',
    },
  ]

  private readonly DOCS_ROOT = process.env.DOCS_ROOT || '/app/docs'

  list(categoria?: string) {
    const filtrada = categoria
      ? this.DOCS.filter(d => d.categoria === categoria)
      : this.DOCS

    return filtrada
      .map(d => ({
        filename: d.filename,
        title: d.title,
        description: d.description,
        ordem: d.ordem,
        categoria: d.categoria,
      }))
      .sort((a, b) => a.ordem - b.ordem)
  }

  async get(filename: string): Promise<{ filename: string; title: string; content: string; updatedAt: string }> {
    // 1. Whitelist check — evita path traversal logo na entrada
    const meta = this.DOCS.find(d => d.filename === filename)
    if (!meta) {
      throw new NotFoundException(`Documento "${filename}" não disponível`)
    }

    // 2. Defesa em profundidade — resolve caminho e confirma que ainda está dentro de DOCS_ROOT
    const root = path.resolve(this.DOCS_ROOT)
    const fullPath = path.resolve(root, filename)
    if (!fullPath.startsWith(root + path.sep) && fullPath !== root) {
      this.logger.warn(`[DOCS] Tentativa de path traversal bloqueada: ${filename}`)
      throw new NotFoundException(`Documento "${filename}" não disponível`)
    }

    // 3. Lê arquivo
    try {
      const [content, stat] = await Promise.all([
        fs.readFile(fullPath, 'utf-8'),
        fs.stat(fullPath),
      ])
      return {
        filename,
        title: meta.title,
        content,
        updatedAt: stat.mtime.toISOString(),
      }
    } catch (err: any) {
      this.logger.error(`[DOCS] Erro ao ler ${filename}: ${err?.message}`)
      throw new NotFoundException(
        `Erro ao ler "${filename}": ${err?.code === 'ENOENT' ? 'arquivo não encontrado no servidor' : err?.message || 'erro desconhecido'}`,
      )
    }
  }
}
