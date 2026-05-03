import os
import urllib.request
import re

urls = {
    'cristiano': 'https://www.sosfactory.com/es/producto/cristiano-ronaldo-pegatinas/',
    'messi': 'https://www.sosfactory.com/es/producto/lionel-messi-pegatina/',
    'ramos': 'https://www.sosfactory.com/es/producto/sergio-ramos-iman/',
    'neymar': 'https://www.sosfactory.com/es/producto/neymar-jr-pegatinas/'
}

out_dir = r"c:\Users\suker\source\repos\escuelita loriranda FC\public\images\avatares"
os.makedirs(out_dir, exist_ok=True)

for name, url in urls.items():
    print(f"Scraping {name} from {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
        
        # Ocurrencia meta og:image
        match = re.search(r'<meta property="og:image"\s+content="([^"]+)"', html)
        if match:
            img_url = match.group(1)
            print(f"Encontrado img: {img_url}")
            
            img_req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(img_req) as img_response:
                img_data = img_response.read()
                
            ext = img_url.split('.')[-1].split('?')[0]
            if len(ext) > 4: ext = 'jpg'
            file_path = os.path.join(out_dir, f"{name}.{ext}")
            with open(file_path, 'wb') as f:
                f.write(img_data)
            print(f"Descargado: {file_path}")
        else:
            print(f"No se encontró imagen para {name}")
    except Exception as e:
        print(f"Error procesando {name}: {e}")
