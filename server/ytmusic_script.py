from ytmusicapi import YTMusic
import json
import sys

def fetch_song_details(song_query):
    ytmusic = YTMusic('./server/oauth.json')
    search_results = ytmusic.search(song_query, filter='songs')
    
    if len(search_results) > 0:
        first_result = search_results[0]
        song_details = {
            "serviceName": "YouTube Music",
            "songName": first_result['title'],
            "link": first_result['videoId'],
            "metadata": first_result['album']['name'],
            "artist": ', '.join([artist['name'] for artist in first_result['artists']]),
            "album": first_result['album']['name']
        }
        print(json.dumps(song_details))

if __name__ == "__main__":
    song_query = sys.argv[1]
    fetch_song_details(song_query)
