use std::{
  process::Command,
  string::String,
};

use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ShellResult {
  stdout: String,
  stderr: String,
  exit_code: i32,
}

#[tauri::command]
fn run_shell(command: String) -> ShellResult {
  let output = if cfg!(target_os = "windows") {
    Command::new("cmd").args(["/C", &command]).output()
  } else {
    Command::new("sh").args(["-lc", &command]).output()
  };

  match output {
    Ok(output) => ShellResult {
      stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
      stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
      exit_code: output.status.code().unwrap_or(-1),
    },
    Err(error) => ShellResult {
      stdout: String::new(),
      stderr: error.to_string(),
      exit_code: -1,
    },
  }
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![run_shell])
    .run(tauri::generate_context!())
    .expect("error while running WhiteKit");
}
