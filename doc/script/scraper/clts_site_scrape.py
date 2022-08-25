from bs4 import BeautifulSoup
import requests as r
import pandas as pd

BASE_URL = "http://wash.health.go.ke"
LOGIN_URL = f"{BASE_URL}/clts/login"
SCRAPE_URL = "/clts/user/loadGuestDashboard"


def get_session():
    ses = r.Session()
    ses.get(LOGIN_URL)
    return ses


def get_administration(parent_id=0, child=None):
    s = get_session()
    data = []
    url = f"{BASE_URL}{SCRAPE_URL}"
    if parent_id:
        url = f"{BASE_URL}{child}"
    page = s.get(url)
    soup = BeautifulSoup(page.content, 'html.parser')
    soup = soup.find("ul", {"class": "unit-filter"})
    if soup:
        for s in soup.find_all("li"):
            a = s.find("a")
            child = a.get("href")
            name = a.find('h6').get_text()
            print(name)
            level = a.find("div", {"class": "text-muted"}).get_text()
            pid = child.split("=")[-1]
            data.append({
                "id": pid,
                "name": name,
                "level": level,
                "parent": parent_id,
                "children_url": child
            })
            if child:
                data += get_administration(pid, child)
    return data


res = get_administration()
df = pd.DataFrame(res)
df.to_csv("./administration_scraped.csv")
