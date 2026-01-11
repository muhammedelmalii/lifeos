import { useListsStore } from '@/store/lists';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { List } from '@/types/domain';
import { v4 as uuidv4 } from 'uuid';
import { findOptimalSlots, createScheduledResponsibilities, SchedulingOptions } from '@/services/dynamicScheduling';
import { parseCommandWithAI, ParsedCommand } from '@/services/aiParser';

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

    // Ensure lists are loaded
    const { loadLists, lists } = useListsStore.getState();
    await loadLists();
    
    let itemsAdded = 0;
    let listsCreated = 0;
    
    for (const listAction of parsed.listActions) {
      // Find existing list (case-insensitive)
      const existingList = useListsStore.getState().lists.find(
        l => l.name.toLowerCase() === listAction.listName.toLowerCase()
      );

      if (existingList) {
        const { updateList } = useListsStore.getState();
        
        // Create new items
        const newItems = listAction.items.map((item: string) => ({
          id: uuidv4(),
          label: item.trim(),
          category: '',
          checked: false,
          createdAt: new Date(),
        }));
        
        // Merge with existing items (avoid duplicates)
        const existingLabels = existingList.items.map(i => i.label.toLowerCase());
        const uniqueNewItems = newItems.filter(
          item => !existingLabels.includes(item.label.toLowerCase())
        );
        
        if (uniqueNewItems.length > 0) {
          const updatedItems = [...existingList.items, ...uniqueNewItems];
          await updateList(existingList.id, { items: updatedItems });
          itemsAdded += uniqueNewItems.length;
        }
      } else {
        const { addList } = useListsStore.getState();
        const newList: List = {
          id: uuidv4(),
          name: listAction.listName,
          type: 'market',
          items: listAction.items.map((item: string) => ({
            id: uuidv4(),
            label: item.trim(),
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
    
    // Reload lists to ensure UI is updated
    await loadLists();
    
    if (itemsAdded > 0) {
      const message = listsCreated > 0 
        ? `${itemsAdded} öğe ${listsCreated} listeye eklendi ✅`
        : `${itemsAdded} öğe listeye eklendi ✅`;
      addMessage('assistant', message);
      showToast(message, 'success');
    } else {
      addMessage('assistant', 'Tüm öğeler zaten listede mevcut.');
    }
  } catch (error) {
    console.error('Error in handleListOnlyCommand:', error);
    addMessage('assistant', `Liste işlemi sırasında hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    showToast('Liste güncellenirken hata oluştu', 'error');
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

/**
 * Handle dynamic scheduling commands (e.g., "haftada 3 gün spor")
 */
export const handleDynamicScheduling = async (
  parsed: ParsedCommand,
  originalText: string,
  addMessage: (type: 'user' | 'assistant' | 'system', text: string, data?: any) => void,
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void
): Promise<boolean> => {
  try {
    const lowerText = originalText.toLowerCase();
    
    // Check if this is a dynamic scheduling command
    // Patterns: "haftada 3 gün spor", "her gün ingilizce çalış", "haftada 2 kez yoga"
    const weeklyPattern = /haftada\s+(\d+)\s*(?:gün|kez|defa)/i;
    const dailyPattern = /her\s+gün|günlük/i;
    const weeklyMatch = lowerText.match(weeklyPattern);
    const isDaily = dailyPattern.test(lowerText);
    
    if (!weeklyMatch && !isDaily && !parsed.schedule?.rrule) {
      return false; // Not a dynamic scheduling command
    }

    // Extract scheduling options
    const options: SchedulingOptions = {
      frequency: isDaily ? 'daily' : 'weekly',
      count: weeklyMatch ? parseInt(weeklyMatch[1], 10) : undefined,
      durationMinutes: parsed.energyRequired === 'high' ? 60 : 30,
      energyLevel: parsed.energyRequired || 'medium',
      preferredTimes: parsed.energyRequired === 'high' ? ['morning'] : ['morning', 'evening'],
    };

    // Extract title and description
    const title = parsed.title || originalText;
    const description = parsed.description || originalText;

    addMessage('assistant', 'En uygun zamanları buluyorum...');
    
    // Find optimal slots
    const slots = await findOptimalSlots(options);
    
    if (slots.length === 0) {
      addMessage('assistant', 'Üzgünüm, uygun zaman bulamadım. Takviminiz çok dolu görünüyor.');
      return true;
    }

    // Create responsibilities for each slot
    const responsibilityIds = await createScheduledResponsibilities(
      title,
      description,
      slots,
      options
    );

    const { loadResponsibilities } = useResponsibilitiesStore.getState();
    await loadResponsibilities();

    const count = slots.length;
    const message = isDaily 
      ? `✅ Her gün "${title}" için hatırlatıcı oluşturuldu!`
      : `✅ Haftada ${count} gün "${title}" için en uygun zamanlarda hatırlatıcılar oluşturuldu!`;
    
    addMessage('assistant', message);
    showToast(message, 'success');
    
    return true;
  } catch (error) {
    console.error('Error in handleDynamicScheduling:', error);
    addMessage('assistant', `Planlama sırasında hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    return false;
  }
};
