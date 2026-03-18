const supabaseUrl = "https://ibftxwnyyxxvouymdcxu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImliZnR4d255eXh4dm91eW1kY3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNTg1ODgsImV4cCI6MjA4ODgzNDU4OH0.pC6q8GP14udTvKHWILwnOJwGmE6F7oZPWXdrYolM-78";

const supabase = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);