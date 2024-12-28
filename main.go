package main

import (
    "encoding/json"
    "fmt"
    "html/template"
    "io"
    "log"
    "net/http"
    "os"
    "path/filepath"
)

// PiggyBankItem represents a single item in the piggy bank
type PiggyBankItem struct {
    Name           string  `json:"name"`
    Amount         float64 `json:"amount"`
    Target         float64 `json:"target"`
    TargetDate     string  `json:"targetDate"`
    MonthsToTarget int     `json:"monthsToTarget"`
    MonthlySavings float64 `json:"monthlySavings"`
}

func main() {
    // Create a file server for static files
    fs := http.FileServer(http.Dir("static"))

    // Handle static files
    http.Handle("/css/", fs)
    http.Handle("/script/", fs)
    http.Handle("/favicon.ico", fs)

    // Handle main page
    http.HandleFunc("/", handleHome)
    
    // Handle data endpoints
    http.HandleFunc("/data/piggybank.json", handleData)
    http.HandleFunc("/api/save", handleSave)

    // Start server
    fmt.Println("Server starting on http://localhost:8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleHome(w http.ResponseWriter, r *http.Request) {
    if r.URL.Path != "/" {
        http.NotFound(w, r)
        return
    }

    tmpl, err := template.ParseFiles("static/index.html")
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    err = tmpl.Execute(w, nil)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
    }
}

func handleData(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    dataFile := filepath.Join("data", "piggybank.json")
    file, err := os.Open(dataFile)
    if err != nil {
        // If file doesn't exist, return empty array
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte("[]"))
        return
    }
    defer file.Close()

    w.Header().Set("Content-Type", "application/json")
    io.Copy(w, file)
}

func handleSave(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    // Read the request body
    var items []PiggyBankItem
    err := json.NewDecoder(r.Body).Decode(&items)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    // Ensure data directory exists
    err = os.MkdirAll("data", 0755)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // Save to file
    dataFile := filepath.Join("data", "piggybank.json")
    file, err := os.Create(dataFile)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer file.Close()

    encoder := json.NewEncoder(file)
    encoder.SetIndent("", "  ")
    err = encoder.Encode(items)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
}
