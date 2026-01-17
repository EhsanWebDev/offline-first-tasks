// model/Post.js
import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'

class Task extends Model {
  static table = 'tasks'

  @field('title') title 
  @field('description') description 
  @field('due_date') due_date 
  @field('is_completed') is_completed 
  @field('priority') priority 
  @field('created_at') created_at 
}

export default Task;