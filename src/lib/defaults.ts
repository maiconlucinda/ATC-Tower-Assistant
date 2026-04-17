import type { PhraseCategory, GlobalVariable } from '@/types';

export function getDefaultCategories(): PhraseCategory[] {
    return [
        { id: 'cat-1', name: 'AUTORIZAÇÃO', sortOrder: 1 },
        { id: 'cat-2', name: 'PUSHBACK E ACIONAMENTO', sortOrder: 2 },
        { id: 'cat-3', name: 'TAXI', sortOrder: 3 },
        { id: 'cat-4', name: 'DECOLAGEM', sortOrder: 4 },
        { id: 'cat-5', name: 'POUSO', sortOrder: 5 },
        { id: 'cat-6', name: 'PÓS-POUSO', sortOrder: 6 },
    ];
}

export function getDefaultGlobalVariables(): GlobalVariable[] {
    return [
        { name: 'aeroporto', token: '{aeroporto}', value: '' },
        { name: 'pista_decolagem', token: '{pista_decolagem}', value: '' },
        { name: 'pista_pouso', token: '{pista_pouso}', value: '' },
        { name: 'direcao_vento', token: '{direcao_vento}', value: '' },
        { name: 'velocidade_vento', token: '{velocidade_vento}', value: '' },
        { name: 'qnh', token: '{qnh}', value: '' },
        { name: 'frequencia_saida', token: '{frequencia_saida}', value: '' },
    ];
}
