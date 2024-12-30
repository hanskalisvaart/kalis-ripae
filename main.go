package main

import (
    "encoding/json"
    "fmt"
    "html/template"
    "io"
    "log"
    "net/http"
    "os"
    "time"
    "path/filepath"
)

// PiggyBankItem represents a single item in the piggy bank
type PiggyBankItem struct {
    Name           string  `json:"name"`
    Amount         float64 `json:"amount"`
    Target         float64 `json:"target"`
    TargetDate     string  `json:"targetDate"`
    MonthsToTarget int     `json:"monthsToTarget"`
    MonthlySavings float64   `json:"monthlySavings"`
    History        []History `json:"history"`
}

// History represents historical data for each month
type History struct {
    Date   string  `json:"date"`
    Amount float64 `json:"amount"`
    Target float64 `json:"target"`
}

func main() {
    // Create a file server for static files
    fs := http.FileServer(http.Dir("static"))

    // Handle static files
    http.Handle("/css/", fs)
    http.Handle("/script/", fs)
    http.Handle("/favicon.svg", fs)

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

    // Load existing data to merge history
    existingItems, err := loadExistingData()
    if err == nil {
        mergeHistory(items, existingItems)
    }

    // Add new history entry for current state
    currentDate := time.Now().Format("2006-01")
    for i := range items {
        // Initialize history if it doesn't exist
        if items[i].History == nil {
            items[i].History = []History{}
        }

        // Add current state to history if it's a new month
        if len(items[i].History) == 0 || items[i].History[len(items[i].History)-1].Date != currentDate {
            items[i].History = append(items[i].History, History{
                Date:   currentDate,
                Amount: items[i].Amount,
                Target: items[i].Target,
            })
        } else {
            // Update the current month's values
            lastIdx := len(items[i].History) - 1
            items[i].History[lastIdx].Amount = items[i].Amount
            items[i].History[lastIdx].Target = items[i].Target
        }
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
    encoder.SetIndent("", " ")
    err = encoder.Encode(items)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
}

func loadExistingData() ([]PiggyBankItem, error) {
    dataFile := filepath.Join("data", "piggybank.json")
    file, err := os.Open(dataFile)
    if err != nil {
        return nil, err
    }
    defer file.Close()

    var items []PiggyBankItem
    err = json.NewDecoder(file).Decode(&items)
    if err != nil {
        return nil, err
    }

    return items, nil
}

func mergeHistory(newItems []PiggyBankItem, existingItems []PiggyBankItem) {
    for i, newItem := range newItems {
        for _, existingItem := range existingItems {
            if newItem.Name == existingItem.Name {
                newItems[i].History = existingItem.History
                break
            }
        }
    }
}