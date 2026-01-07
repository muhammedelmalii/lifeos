import { useListsStore } from '@/store/lists';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { List } from '@/types/domain';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  data?: any;
}

export const handleListOnlyCommand = async (
  parsed: any,
  addMessage: (type: 'user' | 'assistant' | 'system', text: string, data?: any) => void,
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void
) => {
  try {
    if (!parsed.listActions || parsed.listActions.length === 0) {
      addMessage('assistant', 'Liste işlemi bulunamadı.');
      return;
    }

    const { loadLists } = useListsStore.getState();
    await loadLists();
    
    let itemsAdded = 0;
    let listsCreated = 0;
    
    for (const listAction of parsed.listActions) {
      const existingList = useListsStore.getState().lists.find(
        l => l.name.toLowerCase() === listAction.listName.toLowerCase()
      );

      if (existingList) {
        const { updateList } = useListsStore.getState();
        const newItems = listAction.items.map((item: string) => ({
          id: uuidv4(),
          label: item,
          category: '',
          checked: false,
          createdAt: new Date(),
        }));
        const updatedItems = [...existingList.items, ...newItems];
        await updateList(existingList.id, { items: updatedItems });
        itemsAdded += newItems.length;
      } else {
        const { addList } = useListsStore.getState();
        const newList: List = {
          id: uuidv4(),
          name: listAction.listName,
          type: 'market',
          items: listAction.items.map((item: string) => ({
            id: uuidv4(),
            label: item,
            category: '',
            checked: false,
            createdAt: new Date(),
          })),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await addList(newList);
        listsCreated++;
        itemsAdded += newList.items.length;
      }
    }
    
    if (itemsAdded > 0) {
      const message = listsCreated > 0 
        ? `${itemsAdded} öğe ${listsCreated} listeye eklendi ✅`
        : `${itemsAdded} öğe listeye eklendi ✅`;
      addMessage('assistant', message);
      showToast(message, 'success');
    }
  } catch (error) {
    console.error('Error in handleListOnlyCommand:', error);
    addMessage('assistant', `Liste işlemi sırasında hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
};

export const handleQueryCommand = async (
  parsed: any,
  originalText: string,
  setQueryResults: (results: any) => void,
  setShowQueryResults: (show: boolean) => void,
  addMessage: (type: 'user' | 'assistant' | 'system', text: string, data?: any) => void
) => {
  try {
    const { loadLists } = useListsStore.getState();
    await loadLists();
    
    const { getByCategory, getTodayByCategory } = useResponsibilitiesStore.getState();
    
    if (parsed.queryType === 'list' && parsed.queryListName) {
      const list = useListsStore.getState().lists.find(
        l => l.name.toLowerCase() === parsed.queryListName.toLowerCase()
      );
      if (list) {
        setQueryResults({
          type: 'list',
          listName: parsed.queryListName,
          list: list,
          items: list.items,
        });
        setShowQueryResults(true);
        addMessage('assistant', `${list.items.length} öğe bulundu. Listeyi görmek için açın.`);
      } else {
        addMessage('assistant', `Liste bulunamadı: ${parsed.queryListName}`);
      }
    } else if (parsed.queryCategory) {
      const items = parsed.queryType === 'show' && originalText.toLowerCase().includes('today')
        ? getTodayByCategory(parsed.queryCategory)
        : getByCategory(parsed.queryCategory);
      setQueryResults({
        type: 'category',
        category: parsed.queryCategory,
        items: items,
      });
      setShowQueryResults(true);
      addMessage('assistant', `${items.length} görev bulundu.`);
    } else if (parsed.queryType === 'show') {
      const today = getTodayByCategory('');
      setQueryResults({
        type: 'today',
        items: today,
      });
      setShowQueryResults(true);
      addMessage('assistant', `Bugün ${today.length} görev var.`);
    } else {
      addMessage('assistant', 'Sorgu tipi tanınmadı.');
    }
  } catch (error) {
    console.error('Error in handleQueryCommand:', error);
    addMessage('assistant', `Sorgu işlemi sırasında hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
};

