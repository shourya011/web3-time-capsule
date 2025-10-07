// Debug script to check localStorage state and test auto-unlock
// Run this in browser console to debug the auto-unlock issue

console.log('=== DEBUG: Checking Time Capsule localStorage ===');

// Check stored capsules
const storedCapsules = JSON.parse(localStorage.getItem('timeCapsules') || '[]');
console.log('📦 Stored Capsules:', storedCapsules);

// Check recovery kits
const recoveryKits = JSON.parse(localStorage.getItem('capsuleKeys') || '[]');
console.log('🔑 Recovery Kits:', recoveryKits);

// Check revealed capsules
const revealedCapsules = JSON.parse(localStorage.getItem('revealedCapsules') || '[]');
console.log('👁️ Revealed Capsules:', revealedCapsules);

// Check current time vs unlock times
const currentTime = Date.now() / 1000;
console.log('⏰ Current Time (Unix):', currentTime);
console.log('⏰ Current Time (Human):', new Date());

storedCapsules.forEach(capsule => {
  const isUnlocked = currentTime >= capsule.unlockTime;
  const unlockDate = new Date(capsule.unlockTime * 1000);
  console.log(`📋 Capsule "${capsule.title}":`, {
    id: capsule.id,
    unlockTime: capsule.unlockTime,
    unlockDate: unlockDate.toLocaleString(),
    isUnlocked,
    creator: capsule.creator
  });
});

// Test auto-unlock function
async function testAutoUnlock() {
  console.log('🧪 Testing auto-unlock...');
  
  // Get user address (you might need to adjust this)
  const userAddress = 'user123'; // or your actual wallet address
  
  try {
    // Import the reveal service (if available in console context)
    if (typeof window !== 'undefined' && window.revealService) {
      const count = await window.revealService.checkAndRevealUnlockedCapsules(userAddress);
      console.log('✅ Auto-unlock test result:', count, 'capsules processed');
    } else {
      console.log('❌ RevealService not available in window context');
    }
  } catch (error) {
    console.error('❌ Auto-unlock test failed:', error);
  }
}

// Run the test
testAutoUnlock();