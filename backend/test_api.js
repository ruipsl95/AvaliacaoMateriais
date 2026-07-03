const data = {
  name: "API Subject",
  year: "",
  courseId: "13a47dbb-2dbc-46d1-bd96-1863da750e44",
  disciplinaryGroupId: "974bbcb3-e31c-4f88-9a63-6d1f0550bc9e",
  teacherId: "a8d2c6fb-89a5-4cc7-ad45-801286a0617b"
};

fetch("http://localhost:3000/api/admin/subjects", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE4ZDJjNmZiLTg5YTUtNGNjNy1hZDQ1LTgwMTI4NmEwNjE3YiIsInJvbGUiOiJBRE1JTiIsImRpc2NpcGxpbmFyeUdyb3VwSWQiOm51bGwsImlhdCI6MTc4MzA4NzE0MCwiZXhwIjoxNzgzMTczNTQwfQ.RxOMzB5ULK0PBFqFJ2xOyeGmzwNBBX5H3nMy1fWLYwI"
  },
  body: JSON.stringify(data)
})
.then(r => r.text())
.then(t => console.log(t))
.catch(e => console.error(e));
