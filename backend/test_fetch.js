const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: '9df1bef4-f9df-4469-ba85-c8cb6970aefc', role: 'EVALUATOR', disciplinaryGroupId: '974bbcb3-e31c-4f88-9a63-6d1f0550bc9e' },
  'super_secret_key_change_me_in_prod',
  { expiresIn: '24h' }
);

async function testFetch() {
  const res = await fetch('http://localhost:3000/api/evaluations/my-data', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log(data);
}
testFetch();
