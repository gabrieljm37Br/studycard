import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface UseDeckDataParams {
    deckId: string | undefined;
    user: any;
}

export const useDeckData = ({ deckId, user }: UseDeckDataParams) => {
    const [deckName, setDeckName] = useState('');
    const [tempDeckName, setTempDeckName] = useState('');
    const [parentId, setParentId] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [subdecks, setSubdecks] = useState<{ id: string; name: string }[]>([]);
    const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([]);

    const buildBreadcrumbTrail = async (id: string, name: string, parent: string | null) => {
        if (!user) return;
        const trail: { id: string | null; name: string }[] = [{ id: null, name: 'Meus Decks' }];
        const lineage: { id: string; name: string; parent_id: string | null }[] = [];

        let currentParent = parent;
        while (currentParent) {
            const { data, error } = await supabase
                .from('decks')
                .select('id, name, parent_id')
                .eq('id', currentParent)
                .eq('user_id', user.id)
                .maybeSingle();
            if (error || !data) break;
            lineage.push(data);
            currentParent = data.parent_id;
        }

        lineage.reverse().forEach(d => trail.push({ id: d.id, name: d.name }));
        trail.push({ id, name });
        setBreadcrumb(trail);
    };

    const loadDeckDetails = async () => {
        if (!deckId) return;
        try {
            const { data, error } = await supabase
                .from('decks')
                .select('name, parent_id')
                .eq('id', deckId)
                .single();
            if (error) throw error;
            setDeckName(data.name);
            setTempDeckName(data.name);
            setParentId(data.parent_id);
            await buildBreadcrumbTrail(deckId, data.name, data.parent_id);
        } catch (error) {
            console.error('Error loading deck details:', error);
        }
    };

    const loadSubdecks = async () => {
        if (!deckId || !user) return;
        try {
            const { data, error } = await supabase
                .from('decks')
                .select('id, name')
                .eq('parent_id', deckId)
                .eq('user_id', user.id)
                .order('name', { ascending: true });
            if (error) throw error;
            setSubdecks(data || []);
        } catch (error) {
            console.error('Error loading subdecks:', error);
        }
    };

    useEffect(() => {
        if (deckId && user) {
            loadDeckDetails();
            loadSubdecks();
        }
    }, [deckId, user]);

    const handleUpdateDeckName = async () => {
        if (!tempDeckName.trim() || tempDeckName === deckName) {
            setIsEditingName(false);
            setTempDeckName(deckName);
            return;
        }
        try {
            const { error } = await supabase
                .from('decks')
                .update({ name: tempDeckName.trim() })
                .eq('id', deckId);
            if (error) throw error;
            setDeckName(tempDeckName);
            setIsEditingName(false);
        } catch (error) {
            console.error('Error updating deck name:', error);
            alert('Erro ao atualizar nome do deck');
        }
    };

    return {
        deckName,
        tempDeckName,
        setTempDeckName,
        isEditingName,
        setIsEditingName,
        parentId,
        subdecks,
        breadcrumb,
        handleUpdateDeckName,
        reloadDeck: loadDeckDetails
    };
};
