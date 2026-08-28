require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Connected to Supabase Database.');
} else {
  console.log('Using local file database (data/db.json).');
}

// Local JSON file helpers with memory & /tmp fallback for Serverless / Vercel
const TMP_DB_FILE = path.join('/tmp', 'guidance_db.json');
let memoryCache = null;

function readLocalDb() {
  if (memoryCache) return memoryCache;
  try {
    if (fs.existsSync(TMP_DB_FILE)) {
      const raw = fs.readFileSync(TMP_DB_FILE, 'utf-8');
      memoryCache = JSON.parse(raw);
      return memoryCache;
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      memoryCache = JSON.parse(raw);
      return memoryCache;
    }
    return {};
  } catch (err) {
    console.error('Error reading db.json:', err);
    return memoryCache || {};
  }
}

function writeLocalDb(data) {
  memoryCache = data;
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    try {
      fs.writeFileSync(TMP_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (tmpErr) {
      console.warn('Persisted to serverless in-memory cache.');
      return true;
    }
  }
}

const db = {
  client: supabase,

  getCollection: async (name) => {
    if (supabase) {
      try {
        if (name === 'processed_papers') {
          const { data, error } = await supabase.from('processed_papers').select('paper_hash');
          if (!error && data) return data.map(r => r.paper_hash);
        }
        const { data, error } = await supabase.from(name).select('*');
        if (!error && data) return data;
      } catch (e) {
        console.warn(`Supabase getCollection(${name}) failed, falling back to local:`, e.message);
      }
    }
    const local = readLocalDb();
    return local[name] || [];
  },

  setCollection: async (name, items) => {
    if (supabase) {
      try {
        if (name === 'processed_papers') {
          const rows = items.map(hash => ({ paper_hash: hash }));
          const { error } = await supabase.from('processed_papers').upsert(rows);
          if (!error) return true;
        }
      } catch (e) {
        console.warn(`Supabase setCollection(${name}) failed:`, e.message);
      }
    }
    const local = readLocalDb();
    local[name] = items;
    return writeLocalDb(local);
  },

  findOne: async (collection, query) => {
    if (supabase) {
      try {
        let builder = supabase.from(collection).select('*');
        for (const [key, value] of Object.entries(query)) {
          builder = builder.eq(key, value);
        }
        const { data, error } = await builder.limit(1).maybeSingle();
        if (!error && data !== undefined) return data;
      } catch (e) {
        console.warn(`Supabase findOne(${collection}) failed, using local:`, e.message);
      }
    }
    const local = readLocalDb();
    const list = local[collection] || [];
    return list.find(item => {
      return Object.entries(query).every(([k, v]) => String(item[k]) === String(v));
    }) || null;
  },

  findMany: async (collection, query = {}) => {
    if (supabase) {
      try {
        let builder = supabase.from(collection).select('*');
        for (const [key, value] of Object.entries(query)) {
          builder = builder.eq(key, value);
        }
        const { data, error } = await builder;
        if (!error && data) return data;
      } catch (e) {
        console.warn(`Supabase findMany(${collection}) failed, using local:`, e.message);
      }
    }
    const local = readLocalDb();
    const list = local[collection] || [];
    if (Object.keys(query).length === 0) return list;
    return list.filter(item => {
      return Object.entries(query).every(([k, v]) => String(item[k]) === String(v));
    });
  },

  insert: async (collection, item) => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from(collection).insert(item).select().single();
        if (!error && data) return data;
      } catch (e) {
        console.warn(`Supabase insert(${collection}) failed, using local:`, e.message);
      }
    }
    const local = readLocalDb();
    if (!local[collection]) local[collection] = [];
    local[collection].push(item);
    writeLocalDb(local);
    return item;
  },

  update: async (collection, query, updates) => {
    if (supabase) {
      try {
        let builder = supabase.from(collection).update(updates);
        for (const [key, value] of Object.entries(query)) {
          builder = builder.eq(key, value);
        }
        const { data, error } = await builder.select();
        if (!error && data && data.length > 0) return data[0];
      } catch (e) {
        console.warn(`Supabase update(${collection}) failed, using local:`, e.message);
      }
    }
    const local = readLocalDb();
    const list = local[collection] || [];
    let updatedItem = null;
    local[collection] = list.map(item => {
      const isMatch = Object.entries(query).every(([k, v]) => String(item[k]) === String(v));
      if (isMatch) {
        updatedItem = { ...item, ...updates };
        return updatedItem;
      }
      return item;
    });
    writeLocalDb(local);
    return updatedItem;
  },

  delete: async (collection, query) => {
    if (supabase) {
      try {
        let builder = supabase.from(collection).delete({ count: 'exact' });
        for (const [key, value] of Object.entries(query)) {
          builder = builder.eq(key, value);
        }
        const { count, error } = await builder;
        if (!error) return count || 0;
      } catch (e) {
        console.warn(`Supabase delete(${collection}) failed, using local:`, e.message);
      }
    }
    const local = readLocalDb();
    const list = local[collection] || [];
    const initialLen = list.length;
    local[collection] = list.filter(item => {
      return !Object.entries(query).every(([k, v]) => String(item[k]) === String(v));
    });
    const deletedCount = initialLen - local[collection].length;
    writeLocalDb(local);
    return deletedCount;
  }
};

module.exports = db;
