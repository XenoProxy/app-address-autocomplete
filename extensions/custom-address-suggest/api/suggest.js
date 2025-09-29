import { createClient } from '@supabase/supabase-js';

// Переменные окружения (будут получены из настроек Vercel)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('Supabase client initialized.', supabase);

// Настройки CORS: разрешаем доступ только вашему dev-магазину Shopify
const setCorsHeaders = (res) => {
    // ВАЖНО: Указываем ваш конкретный домен dev-магазина
    res.setHeader('Access-Control-Allow-Origin', 'https://sequoialipo-dev-2.myshopify.com'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async (req, res) => {
    setCorsHeaders(res);

    // Обработка запросов OPTIONS (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.status(204).end(); 
        return;
    }
    
    // Получаем запрос 'query' от Shopify
    const searchQuery = req.query.query; 
    console.log('Received query:', searchQuery);

    // Если запрос пустой или слишком короткий, возвращаем пустой массив
    
    if (!searchQuery || searchQuery.length < 2) {
        return res.status(200).json([]);
    }
    
    const formattedQuery = `%${searchQuery}%`;
    console.log('Formatted query for Supabase:', formattedQuery);
    const tableName = 'Street';

    // Запрос к Supabase, используя поля из вашего скриншота
    try {
        const { data, error } = await supabase
            .from(tableName) 
            .select('Id, Settlement, NameStreet, StreetSymbol') 
            .or(
                `Settlement.ilike.${formattedQuery},NameStreet.ilike.${formattedQuery}`
            ) 
            .limit(100); 

        if (error) {
            console.error('Supabase Query Error:', error);
            return res.status(500).json({ error: 'Database query failed.', details: error.message });
        }

        // Возвращаем данные (они будут содержать поля Settlement и NameStreet)
        res.status(200).json(data);

    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ error: 'Internal server error.' });
    }
};