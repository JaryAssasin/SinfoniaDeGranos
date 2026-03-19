const supabaseUrl = "https://ovfgxijmyhpppmqocxtx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92Zmd4aWpteWhwcHBtcW9jeHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MjcxMzcsImV4cCI6MjA4OTUwMzEzN30.qvZbiTUVsy0azWEndL07y_trBEBVeewaEPV6IsoDrFY";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

window.supabaseClient = supabase;