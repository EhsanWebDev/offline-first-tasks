import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../db'; // Your DB instance
import { supabase } from '../utils/supabase'; // Your Supabase client

export async function mySync() {
  await synchronize({
    database,
    // 1. PULL: Get changes from Supabase
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      // 'lastPulledAt' is a timestamp (or null if first sync)
      // If null, we fetch everything (0).
      const lastSynced = lastPulledAt || 0;

      // Query Supabase for changes since the last sync
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .gt('updated_at', new Date(lastSynced).toISOString()); // Assuming Postgres uses ISO strings
    
        

      if (error) throw new Error(error.message);

      // Format for WatermelonDB
      // We must separate 'created' from 'updated'. 
      // Simplified strategy: Treat everything as 'updated' (Watermelon handles the diff if ID matches)
      // OR stricter: Check created_at vs updated_at.
      
      return {
        changes: {
          tasks: {
            created: [], // Optional: You can put new items here if you filter by created_at
            updated: tasks || [], // Watermelon is smart enough to create if it doesn't exist
            deleted: [], // Handling deletes requires a 'deleted_at' column or a separate 'deleted_tasks' table
          },
        },
        timestamp: new Date().getTime(), // New reference point
      };
    },

    // 2. PUSH: Send local changes to Supabase
    pushChanges: async ({ changes, lastPulledAt }) => {
      const { tasks } = changes;

      // A. Handle Created
      if (tasks.created.length > 0) {
        // Must strip _status, _changed, etc. before sending to Supabase
        const records = tasks.created.map(entry => ({
          id: entry.id,
          title: entry.title,
          is_completed: entry.is_completed,
          created_at: new Date(entry.created_at).toISOString(),
          updated_at: new Date().toISOString(),
          // Add other fields...
        }));
        
        const { error } = await supabase.from('tasks').insert(records);
        if (error) throw new Error('Push create failed: ' + error.message);
      }

      // B. Handle Updated
      if (tasks.updated.length > 0) {
        for (const entry of tasks.updated) {
          const { error } = await supabase
            .from('tasks')
            .update({ 
              title: entry.title, 
              is_completed: entry.is_completed, 
              updated_at: new Date().toISOString()
            })
            .eq('id', entry.id);
            
          if (error) throw new Error('Push update failed: ' + error.message);
        }
      }

      // C. Handle Deleted
      if (tasks.deleted.length > 0) {
        // We usually don't "hard delete" in offline-first apps.
        // We set a 'deleted_at' flag. But if you want hard delete:
        const ids = tasks.deleted;
        const { error } = await supabase.from('tasks').delete().in('id', ids);
        if (error) throw new Error('Push delete failed: ' + error.message);
      }
    },
  });
}