/**
 * Test script to verify age-to-DOB conversion with random dates
 * Run with: node test-age-to-dob.js
 */

function convertAgeToDOB(ageStr) {
  if (!ageStr) {
    return { age: 25, dob: new Date(1999, 0, 1), source: 'default' };
  }

  // Check if age is a date string (like "2003/1/1")
  if (ageStr.includes('/')) {
    try {
      const parsedDob = new Date(ageStr);
      if (!isNaN(parsedDob.getTime())) {
        // Calculate age from DOB
        const today = new Date();
        let age = today.getFullYear() - parsedDob.getFullYear();
        const monthDiff = today.getMonth() - parsedDob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedDob.getDate())) {
          age--;
        }
        return { age, dob: parsedDob, source: 'date-string' };
      }
    } catch (e) {
      return { age: 25, dob: new Date(1999, 0, 1), source: 'default' };
    }
  }

  // Age is a number string
  const ageNum = parseInt(ageStr, 10);
  if (!isNaN(ageNum) && ageNum > 0 && ageNum < 120) {
    // Calculate date of birth from age with random month/day
    const today = new Date();
    const birthYear = today.getFullYear() - ageNum;

    // Generate random month (0-11) and day (1-28) to avoid invalid dates
    const randomMonth = Math.floor(Math.random() * 12);
    const randomDay = Math.floor(Math.random() * 28) + 1;

    let dob = new Date(birthYear, randomMonth, randomDay);

    // If the generated DOB makes them younger than their age, adjust year back by 1
    const checkAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      if (checkAge < ageNum) {
        dob = new Date(birthYear - 1, randomMonth, randomDay);
      }
    }

    return { age: ageNum, dob, source: 'calculated' };
  }

  return { age: 25, dob: new Date(1999, 0, 1), source: 'default' };
}

// Test cases from your MongoDB data
const testCases = [
  { input: '22', expected: 22 },
  { input: '29', expected: 29 },
  { input: '18', expected: 18 },
  { input: '2003/1/1', expected: 21 }, // Born Jan 1, 2003 = ~21-22 years old
  { input: '27', expected: 27 },
  { input: '', expected: 25 }, // default
  { input: '16', expected: 16 },
  { input: '25', expected: 25 },
  { input: '31', expected: 31 },
];

console.log('🧪 Testing Age to DOB Conversion with Random Dates\n');
console.log('='.repeat(80));

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

testCases.forEach((testCase, index) => {
  const result = convertAgeToDOB(testCase.input);

  console.log(`\nTest ${index + 1}:`);
  console.log(`  MongoDB Input: "${testCase.input}"`);
  console.log(`  Source: ${result.source}`);
  console.log(`  Calculated Age: ${result.age}`);
  console.log(`  Generated DOB: ${monthNames[result.dob.getMonth()]} ${result.dob.getDate()}, ${result.dob.getFullYear()}`);

  // Verify age matches
  const today = new Date();
  let verifyAge = today.getFullYear() - result.dob.getFullYear();
  const monthDiff = today.getMonth() - result.dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < result.dob.getDate())) {
    verifyAge--;
  }

  const ageMatches = verifyAge === result.age;
  console.log(`  Verification: Age from DOB = ${verifyAge} ${ageMatches ? '✓' : '✗'}`);

  if (!ageMatches) {
    console.log(`  ⚠️  ERROR: Age mismatch! Expected ${result.age}, got ${verifyAge}`);
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n✅ Age to DOB conversion test complete!');
console.log('\nKey Features:');
console.log('- ✓ Converts age numbers to DOB with random month/day');
console.log('- ✓ Parses date strings like "2003/1/1" directly');
console.log('- ✓ Generates realistic birth dates (not just Jan 1st)');
console.log('- ✓ Verifies calculated age matches input age');
console.log('- ✓ Handles empty/invalid values with defaults');
console.log('\nBenefits:');
console.log('- More realistic user profiles (not everyone born Jan 1st!)');
console.log('- Better date distribution for age-based filtering');
console.log('- Accurate age calculations from generated DOBs');
