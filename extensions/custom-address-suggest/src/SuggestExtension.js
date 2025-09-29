import {extension} from '@shopify/ui-extensions/checkout';

const API_BASE_URL = 'https://app-address-autocomplete.vercel.app/api/suggest'; 

// Поля, для которых мы разрешаем автозаполнение (избегаем ошибки streetName)
const SUPPORTED_FIELDS = ['address1','city']; 

export default extension(
  'purchase.address-autocomplete.suggest',
  async ({ query, selectedCountryCode, field, signal }) => {
    
    const inputValue = query.value;
    console.log('inputValue:', inputValue);

    // 1. Проверки безопасности и совместимости
    if (!SUPPORTED_FIELDS.includes(field)) {
        return [];
    }

    if (selectedCountryCode !== 'IL' || inputValue.length < 2) {
      return []; 
    }

    let apiResponseData = {};

    // 2. Выполнение запроса к Vercel API
    try {
        const url = `${API_BASE_URL}?query=${encodeURIComponent(inputValue)}`;
        const response = await fetch(url, { signal });
        console.log('Fetch response:', response.status);
        
        if (!response.ok) {
            console.error(`API request failed with status: ${response.status}`);
            return [];
        }
        
        // Получаем массив данных с полями NameStreet и Settlement
        apiResponseData = await response.json();
        console.log('API response data:', apiResponseData);
        
    } catch (error) {
        if (error.name === 'AbortError') return [];
        console.error("Fetch error:", error);
        return [];
    }

    const suggestions = apiResponseData.map((suggestion) => {
      
      // Текст, который увидит покупатель (на иврите)
      const suggestionText = `${suggestion.NameStreet}, ${suggestion.Settlement}`;
      return {
        id: suggestion.id,
        matchedSubstrings: suggestionText,
        suggestion: suggestionText,         
        formattedAddress: {
          address1: suggestion.NameStreet, 
          // address2: suggestion.Settlement + ', ' + suggestion.NameStreet + ' ' + suggestion.StreetSymbol,
          city: suggestion.Settlement,
          countryCode: 'IL',
        },
      };
    });

    return { suggestions: suggestions.slice(0, 5) };
  }
);