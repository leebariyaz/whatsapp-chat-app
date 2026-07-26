import { useEffect, useState } from 'react';
import { FolderPlus, X, Trash2, Loader2, Folder } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { ChatFolder } from '@/types';

interface FolderBarProps {
  activeFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onManageFolders: () => void;
}

export function FolderBar({ activeFolder, onSelectFolder, onManageFolders }: FolderBarProps) {
  const { profile } = useAuth();
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase.from('chat_folders').select('*').eq('user_id', profile.id).order('sort_order').then(({ data }) => {
      setFolders((data ?? []) as ChatFolder[]);
      setLoading(false);
    });
  }, [profile]);

  if (loading || folders.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-700 overflow-x-auto">
      <button
        onClick={() => onSelectFolder(null)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeFolder === null ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
      >
        All
      </button>
      {folders.map((f) => (
        <button
          key={f.id}
          onClick={() => onSelectFolder(f.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeFolder === f.id ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        >
          <Folder className="w-3.5 h-3.5" />
          {f.name}
        </button>
      ))}
      <button onClick={onManageFolders} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
        <FolderPlus className="w-4 h-4" />
      </button>
    </div>
  );
}

interface FolderManagerProps {
  conversations: { id: string; name: string }[];
  onClose: () => void;
}

export function FolderManager({ conversations, onClose }: FolderManagerProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [folderItems, setFolderItems] = useState<Record<string, string[]>>({});

  const loadFolders = async () => {
    if (!profile) return;
    const { data } = await supabase.from('chat_folders').select('*').eq('user_id', profile.id).order('sort_order');
    const folderList = (data ?? []) as ChatFolder[];
    setFolders(folderList);

    const itemsMap: Record<string, string[]> = {};
    for (const f of folderList) {
      const { data: items } = await supabase.from('chat_folder_items').select('conversation_id').eq('folder_id', f.id);
      itemsMap[f.id] = (items ?? []).map((i: { conversation_id: string }) => i.conversation_id);
    }
    setFolderItems(itemsMap);
    setLoading(false);
  };

  useEffect(() => { loadFolders(); }, [profile]);

  const createFolder = async () => {
    if (!profile || !newName.trim()) return;
    const { data, error } = await supabase.from('chat_folders').insert({ user_id: profile.id, name: newName.trim() }).select('*').single();
    if (error) { toast('Failed to create folder', 'error'); return; }
    setFolders((prev) => [...prev, data as ChatFolder]);
    setFolderItems((prev) => ({ ...prev, [data.id]: [] }));
    setNewName('');
    toast('Folder created', 'success');
  };

  const deleteFolder = async (id: string) => {
    await supabase.from('chat_folders').delete().eq('id', id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    toast('Folder deleted', 'success');
  };

  const toggleChatInFolder = async (folderId: string, convoId: string) => {
    const items = folderItems[folderId] ?? [];
    if (items.includes(convoId)) {
      await supabase.from('chat_folder_items').delete().eq('folder_id', folderId).eq('conversation_id', convoId);
      setFolderItems((prev) => ({ ...prev, [folderId]: items.filter((id) => id !== convoId) }));
    } else {
      await supabase.from('chat_folder_items').insert({ folder_id: folderId, conversation_id: convoId });
      setFolderItems((prev) => ({ ...prev, [folderId]: [...items, convoId] }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Chat Folders</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex gap-2">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New folder name..." className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:border-teal-400 transition" />
            <button onClick={createFolder} className="px-4 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-medium hover:opacity-90 transition">Create</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-slate-400 animate-spin" /></div>}
          {folders.map((f) => (
            <div key={f.id} className="mb-3">
              <div className="flex items-center gap-2 px-3 py-2">
                <Folder className="w-4 h-4 text-teal-500" />
                <span className="flex-1 font-medium text-slate-700 dark:text-slate-200 text-sm">{f.name}</span>
                <button onClick={() => deleteFolder(f.id)} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="ml-6 space-y-1">
                {conversations.map((c) => {
                  const checked = (folderItems[f.id] ?? []).includes(c.id);
                  return (
                    <label key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={() => toggleChatInFolder(f.id, c.id)} className="accent-teal-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          {!loading && folders.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No folders yet</p>}
        </div>
      </div>
    </div>
  );
}
