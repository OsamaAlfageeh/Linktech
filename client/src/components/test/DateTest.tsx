import React, { useEffect, useState } from 'react';
import { formatDate } from '@/lib/dateFormatter';

const DateTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  
  useEffect(() => {
    console.log('🧪 DateTest component mounted!');
    
    const testResults: string[] = [];
    
    // Test with current date
    const testDate1 = new Date('2025-09-13');
    console.log('🧪 Testing with date:', testDate1);
    const result1 = formatDate(testDate1);
    console.log('🧪 Result 1:', result1);
    testResults.push(`Test 1: ${result1}`);
    
    // Test with string date
    const testDate2 = '2025-09-13T10:30:00Z';
    console.log('🧪 Testing with string date:', testDate2);
    const result2 = formatDate(testDate2);
    console.log('🧪 Result 2:', result2);
    testResults.push(`Test 2: ${result2}`);
    
    // Test with another date
    const testDate3 = '2025-01-15';
    console.log('🧪 Testing with date:', testDate3);
    const result3 = formatDate(testDate3);
    console.log('🧪 Result 3:', result3);
    testResults.push(`Test 3: ${result3}`);
    
    setResults(testResults);
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-red-100">
      <h3 className="text-lg font-bold mb-4">🧪 اختبار تنسيق التاريخ</h3>
      <div className="space-y-2">
        <p><strong>التاريخ 1:</strong> {formatDate('2025-09-13')}</p>
        <p><strong>التاريخ 2:</strong> {formatDate('2025-01-15')}</p>
        <p><strong>التاريخ 3:</strong> {formatDate(new Date())}</p>
      </div>
      <div className="mt-4 p-2 bg-yellow-100 rounded">
        <h4 className="font-bold">نتائج الاختبار:</h4>
        {results.map((result, index) => (
          <p key={index} className="text-sm">{result}</p>
        ))}
      </div>
      <p className="text-sm text-gray-600 mt-4">
        تحقق من وحدة التحكم (Console) لرؤية تفاصيل التنسيق
      </p>
    </div>
  );
};

export default DateTest;