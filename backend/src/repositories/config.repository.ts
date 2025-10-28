import { supabase } from '../config/database';

export class ConfigRepository {
  async getByKey(key: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('config')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to get config by key: ${error.message}`);
    }

    return data?.value || null;
  }

  async setByKey(key: string, value: string): Promise<void> {
    const { error } = await supabase
      .from('config')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) {
      throw new Error(`Failed to set config: ${error.message}`);
    }
  }

  async getAll(): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('config')
      .select('key, value');

    if (error) {
      throw new Error(`Failed to get all config: ${error.message}`);
    }

    const config: Record<string, string> = {};
    data?.forEach(row => {
      config[row.key] = row.value;
    });
    return config;
  }
}

