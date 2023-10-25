You will need to create a .env file in the root folder  and add the following variable: 
**SPOONACULAR_API_KEY = "xyz"** 
where xyz is your spoonacular api key.
You can get that by creating an account on spoonacular.com and then going to your profile page.
You can also use the free version of the api which allows you to make 150 requests per day.
That will suffice for most people.

How to generate the pem keys in /bin
---

# Generating Local SSL Certificates with mkcert

`mkcert` is a tool that simplifies the process of creating locally trusted SSL certificates for development purposes. Follow the steps below to install `mkcert` and generate your SSL certificates.

## Step 1: Installing mkcert

### macOS:

1. Open Terminal.
2. Run the following command to install `mkcert`:
   ```bash
   brew install mkcert
   ```
3. Install `nss` to support Firefox:
   ```bash
   brew install nss
   ```

### Windows:

1. Open Command Prompt or PowerShell as Administrator.
2. Run the following command to install `mkcert`:
   ```bash
   choco install mkcert
   ```

### Linux:

1. Open Terminal.
2. Run the following command to install `mkcert`:
   ```bash
   sudo apt install mkcert
   ```

## Step 2: Setting Up the Local Certificate Authority (CA)

Run the following command to create and install a local CA:

```bash
mkcert -install
```

## Step 3: Generating SSL Certificates

Navigate to the directory where you want the certificates to be saved, and run:

```bash
mkcert localhost 127.0.0.1 ::1
```

This command creates SSL certificates for localhost and saves them in the current directory.

---

Now, you should have the SSL certificates generated and ready to be used by the application. Remember to keep your certificates secure and don’t share them publicly.