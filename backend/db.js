require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('\x1b[33mWarning: Supabase URL or Anon Key is missing or placeholders in .env file. Database operations will fail.\x1b[0m');
}

const db = {
  // Reference to original supabase client
  client: supabase,

  read: () => {
    console.warn('db.read() is deprecated in Supabase async mode.');
    return {};
  },

  write: () => {
    console.warn('db.write() is deprecated in Supabase async mode.');
    return true;
  },

  getCollection: async (name) => {
    if (!supabase) throw new Error("Supabase client is not initialized. Please configure .env file.");
    
    // Special handling for processed_papers (an array of string hashes in original code)
    if (name === 'processed_papers') {
      const { data, error } = await supabase.from('processed_papers').select('paper_hash');
      if (error) throw error;
      return (data || []).map(r => r.paper_hash);
    }

    const { data, error } = await supabase.from(name).select('*');
    if (error) throw error;
    return data || [];
  },

  setCollection: async (name, items) => {
    if (!supabase) throw new Error("Supabase client is not initialized. Please configure .env file.");

    // Special handling for processed_papers
    if (name === 'processed_papers') {
      const rows = items.map(hash => ({ paper_hash: hash }));
      const { error } = await supabase.from('processed_papers').upsert(rows);
      if (error) throw error;
      return true;
    }

    throw new Error(`setCollection() is deprecated/unsupported for table: ${name}`);
  },

  findOne: async (collection, query) => {
    if (!supabase) throw new Error("Supabase client is not initialized. Please configure .env file.");
    let builder = supabase.from(collection).select('*');
    for (const [key, value] of Object.entries(query)) {
      builder = builder.eq(key, value);
    }
    const { data, error } = await builder.limit(1).maybeSingle();
    if (error) throw error;
    return data;
  },

  findMany: async (collection, query = {}) => {
    if (!supabase) throw new Error("Supabase client is not initialized. Please configure .env file.");
    let builder = supabase.from(collection).select('*');
    for (const [key, value] of Object.entries(query)) {
      builder = builder.eq(key, value);
    }
    const { data, error } = await builder;
    if (error) throw error;
    return data || [];
  },

  insert: async (collection, item) => {
    if (!supabase) throw new Error("Supabase client is not initialized. Please configure .env file.");
    const { data, error } = await supabase.from(collection).insert(item).select().single();
    if (error) throw error;
    return data;
  },

  update: async (collection, query, updates) => {
    if (!supabase) throw new Error("Supabase client is not initialized. Please configure .env file.");
    let builder = supabase.from(collection).update(updates);
    for (const [key, value] of Object.entries(query)) {
      builder = builder.eq(key, value);
    }
    const { data, error } = await builder.select();
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  delete: async (collection, query) => {
    if (!supabase) throw new Error("Supabase client is not initialized. Please configure .env file.");
    let builder = supabase.from(collection).delete({ count: 'exact' });
    for (const [key, value] of Object.entries(query)) {
      builder = builder.eq(key, value);
    }
    const { count, error } = await builder;
    if (error) throw error;
    return count || 0;
  }
};

module.exports = db;
