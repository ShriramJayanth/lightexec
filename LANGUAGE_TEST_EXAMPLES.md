# Quick Test Examples for New Languages

## Go (1.21)
```go
package main

import "fmt"

func main() {
    fmt.Println("Hello from Go!")
    fmt.Println("Go version: 1.21")
}
```

## C (GCC 13)
```c
#include <stdio.h>

int main() {
    printf("Hello from C!\n");
    printf("GCC version: 13\n");
    return 0;
}
```

## Rust (1.75)
```rust
fn main() {
    println!("Hello from Rust!");
    println!("Rust version: 1.75");
}
```

## PHP (8.3)
```php
<?php
echo "Hello from PHP!\n";
echo "PHP version: " . phpversion() . "\n";
?>
```

## Ruby (3.3)
```ruby
puts "Hello from Ruby!"
puts "Ruby version: #{RUBY_VERSION}"
```

## Testing with Input/Output

### Go - User Input
```go
package main

import (
    "fmt"
    "bufio"
    "os"
)

func main() {
    reader := bufio.NewReader(os.Stdin)
    fmt.Print("Enter your name: ")
    name, _ := reader.ReadString('\n')
    fmt.Printf("Hello, %s", name)
}
```
**stdin**: `John`

### C - User Input
```c
#include <stdio.h>

int main() {
    char name[50];
    printf("Enter your name: ");
    scanf("%s", name);
    printf("Hello, %s!\n", name);
    return 0;
}
```
**stdin**: `Alice`

### Rust - User Input
```rust
use std::io;

fn main() {
    println!("Enter your name:");
    let mut name = String::new();
    io::stdin().read_line(&mut name).unwrap();
    println!("Hello, {}!", name.trim());
}
```
**stdin**: `Bob`

### PHP - User Input
```php
<?php
echo "Enter your name: ";
$name = trim(fgets(STDIN));
echo "Hello, $name!\n";
?>
```
**stdin**: `Charlie`

### Ruby - User Input
```ruby
puts "Enter your name:"
name = gets.chomp
puts "Hello, #{name}!"
```
**stdin**: `Diana`

## Build and Run Instructions

1. **Build all Docker images:**
   ```bash
   cd /home/shriramjayanth/Desktop/lightexec-project
   ./scripts/build-sandboxes.sh
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

4. **Test each language:**
   - Select the language from the dropdown
   - Paste the test code
   - Click "Run Code"
   - Check the output panel

## Expected Build Time
- Go: ~30-60 seconds
- C: ~20-30 seconds
- Rust: ~60-90 seconds (larger image)
- PHP: ~20-30 seconds
- Ruby: ~20-30 seconds

## Troubleshooting

### If Docker build fails:
```bash
# Check Docker is running
docker ps

# Check Docker permissions
docker run hello-world

# If permission denied:
sudo usermod -aG docker $USER
newgrp docker
```

### If a specific language fails:
```bash
# Build individual image
docker build -t lightexec-go:1.21 sandbox-images/go
docker build -t lightexec-c:gcc13 sandbox-images/c
docker build -t lightexec-rust:1.75 sandbox-images/rust
docker build -t lightexec-php:8.3 sandbox-images/php
docker build -t lightexec-ruby:3.3 sandbox-images/ruby
```

### Verify images are built:
```bash
docker images | grep lightexec
```

Expected output:
```
lightexec-ruby       3.3      <image-id>   <time>   <size>
lightexec-rust       1.75     <image-id>   <time>   <size>
lightexec-php        8.3      <image-id>   <time>   <size>
lightexec-go         1.21     <image-id>   <time>   <size>
lightexec-c          gcc13    <image-id>   <time>   <size>
lightexec-java       21       <image-id>   <time>   <size>
lightexec-cpp        gcc13    <image-id>   <time>   <size>
lightexec-node       20       <image-id>   <time>   <size>
lightexec-python     3.11     <image-id>   <time>   <size>
```
