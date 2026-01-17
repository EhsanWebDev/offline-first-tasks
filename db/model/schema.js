import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
   tableSchema({
      name: 'tasks',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'due_date', type: 'number' },
        { name: 'is_completed', type: 'boolean' },
        { name: 'priority', type: 'string', default: 'medium' },
        { name: 'created_at', type: 'number' },
      ],
    })
  ],
});