use std::process::Command;

#[tauri::command]
fn list_printers() -> Vec<String> {
    // Windows: enumerate installed printers via wmic
    let output = Command::new("wmic")
        .args(["printer", "get", "name", "/format:list"])
        .output();

    match output {
        Ok(o) => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            stdout
                .lines()
                .filter_map(|line| {
                    let line = line.trim();
                    if line.starts_with("Name=") {
                        let name = line.trim_start_matches("Name=").trim();
                        if !name.is_empty() { Some(name.to_string()) } else { None }
                    } else {
                        None
                    }
                })
                .collect()
        }
        Err(_) => Vec::new(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![list_printers])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o Production Guard");
}
