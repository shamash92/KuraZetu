

VENV=venv
PYTHON=$(VENV)/bin/python
REQS=requirements.txt


.PHONY: install-requirements data-extraction

install:
	@echo "Activating venv and installing requirements..."
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r $(REQS)

results-extraction: install
	@echo "Running governor extraction..."
	$(PYTHON) historical/scripts/raw_iebc_results_pdfs_2027/extract_governor_excel.py
	@echo "Running senator extraction..."
	$(PYTHON) historical/scripts/raw_iebc_results_pdfs_2027/extract_senator_excel.py
	@echo "Running mps extraction..."
	$(PYTHON) historical/scripts/raw_iebc_results_pdfs_2027/extract_mps_excel.py
	@echo "Running mcas extraction..."
	$(PYTHON) historical/scripts/raw_iebc_results_pdfs_2027/extract_mcas_excel.py
	@echo "Running women rep extraction..."
	$(PYTHON) historical/scripts/raw_iebc_results_pdfs_2027/extract_women_rep_excel.py
	@echo "Running presidential extraction..."
	$(PYTHON) historical/scripts/raw_iebc_results_pdfs_2027/extract_pres_excel.py
